import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

const cleanEnv = (val) => {
  if (!val) return "";
  // Strip whitespace, quotes, and accidental commas
  return String(val).trim().replace(/^["']|["',]+$/g, '').trim();
};

const firebaseConfig = {
  apiKey: cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(import.meta.env.VITE_FIREBASE_APP_ID)
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Simple channel manager for compatibility with Supabase subscription patterns
class RealtimeChannel {
  constructor(name) {
    this.name = name;
    this.unsubscribers = [];
  }

  on(eventType, filterConfig, callback) {
    // filterConfig: { event: '*', schema: 'public', table: 'table_name', filter?: string }
    const tableName = filterConfig.table;
    const filter = filterConfig.filter;
    const colRef = collection(db, tableName);

    let q = query(colRef);

    // Support simple filter string like 'police_unit_id=eq.123'
    if (filter && filter.includes('=eq.')) {
      const [field, val] = filter.split('=eq.');
      q = query(colRef, where(field.trim(), '==', val.trim()));
    }

    let initialLoaded = false;
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const docData = { id: change.doc.id, ...change.doc.data() };
        let type = 'UPDATE';
        if (change.type === 'added') {
          type = initialLoaded ? 'INSERT' : 'INSERT';
        } else if (change.type === 'modified') {
          type = 'UPDATE';
        } else if (change.type === 'removed') {
          type = 'DELETE';
        }

        callback({
          eventType: type,
          new: docData,
          old: change.type === 'removed' ? { id: change.doc.id } : docData
        });
      });
      initialLoaded = true;
    }, (err) => {
      console.warn(`[Firebase Realtime] Channel ${this.name} error:`, err);
    });

    this.unsubscribers.push(unsub);
    return this;
  }

  subscribe() {
    return this;
  }

  unsubscribe() {
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch (e) { /* ignore */ }
    });
    this.unsubscribers = [];
  }
}

// Active channels registry
const activeChannels = new Map();

// Helper builder to support Supabase fluent query syntax over Firebase Firestore
class QueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.conditions = [];
    this.orderByField = null;
    this.orderDirection = 'asc';
    this.isSingle = false;
    this.selectedFields = null;
  }

  select(fields = '*') {
    this.selectedFields = fields;
    return this;
  }

  eq(field, value) {
    this.conditions.push(where(field, '==', value));
    return this;
  }

  neq(field, value) {
    this.conditions.push(where(field, '!=', value));
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.orderByField = field;
    this.orderDirection = ascending ? 'asc' : 'desc';
    return this;
  }

  in(field, values) {
    this.conditions.push(where(field, 'in', values));
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Execute SELECT
  async then(resolve, reject) {
    try {
      const colRef = collection(db, this.collectionName);

      // Fast-path: query single document directly by doc ID if equality condition matches 'id'
      const idCond = this.conditions.find(c => {
        const fieldName = c._field?.segments?.[0] || c.field;
        const op = c._op || c.op;
        return fieldName === 'id' && (op === '==' || op === 'EQUAL');
      });
      const idVal = idCond?._value !== undefined ? idCond._value : (idCond?._val !== undefined ? idCond._val : idCond?.value);

      if (this.isSingle && idVal) {
        const docSnap = await getDoc(doc(db, this.collectionName, idVal));
        if (!docSnap.exists()) {
          const res = { data: null, error: { message: 'Document not found' } };
          return resolve ? resolve(res) : res;
        }
        const data = { id: docSnap.id, ...docSnap.data() };
        const res = { data, error: null };
        return resolve ? resolve(res) : res;
      }

      let qConstraints = [...this.conditions];
      if (this.orderByField) {
        qConstraints.push(orderBy(this.orderByField, this.orderDirection));
      }

      let snapshot;
      try {
        const q = query(colRef, ...qConstraints);
        snapshot = await getDocs(q);
      } catch (queryErr) {
        // Fallback for missing composite index or complex inequality: fetch collection and filter/sort in memory
        console.warn(`[Firebase Firestore] Query optimization fallback for [${this.collectionName}]:`, queryErr.message);
        snapshot = await getDocs(colRef);
      }

      let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Client-side filter fallback verification
      for (const cond of this.conditions) {
        const field = cond._field?.segments?.[0] || cond.field;
        const op = cond._op || cond.op;
        const val = cond._val !== undefined ? cond._val : cond.value;

        if (field && val !== undefined) {
          if (op === '==' || op === 'EQUAL') {
            items = items.filter(item => item[field] === val);
          } else if (op === '!=' || op === 'NOT_EQUAL') {
            items = items.filter(item => item[field] !== val);
          } else if (op === 'in' || op === 'IN') {
            items = items.filter(item => Array.isArray(val) && val.includes(item[field]));
          }
        }
      }

      // In-memory sorting fallback if requested
      if (this.orderByField) {
        items.sort((a, b) => {
          const valA = a[this.orderByField];
          const valB = b[this.orderByField];
          if (valA === valB) return 0;
          if (valA == null) return 1;
          if (valB == null) return -1;
          const cmp = valA > valB ? 1 : -1;
          return this.orderDirection === 'asc' ? cmp : -cmp;
        });
      }

      // Limit fallback
      if (this.limitCount && this.limitCount > 0) {
        items = items.slice(0, this.limitCount);
      }

      // Special case: Supabase foreign key join simulation `hospital_profiles -> profiles(full_name)`
      if (this.collectionName === 'hospital_profiles' && this.selectedFields && this.selectedFields.includes('profiles(full_name)')) {
        const profDocs = await getDocs(collection(db, 'profiles'));
        const profMap = {};
        profDocs.forEach(p => { profMap[p.id] = p.data(); });
        items = items.map(h => ({
          ...h,
          profiles: profMap[h.id] ? { full_name: profMap[h.id].full_name } : { full_name: 'Unknown Hospital' }
        }));
      }

      // Special case: `trips` history join `hospital_profiles(profiles(full_name))`
      if (this.collectionName === 'trips' && this.selectedFields && this.selectedFields.includes('hospital_profiles')) {
        const hospDocs = await getDocs(collection(db, 'hospital_profiles'));
        const profDocs = await getDocs(collection(db, 'profiles'));
        const profMap = {};
        profDocs.forEach(p => { profMap[p.id] = p.data(); });
        const hospMap = {};
        hospDocs.forEach(h => {
          hospMap[h.id] = {
            ...h.data(),
            profiles: profMap[h.id] ? { full_name: profMap[h.id].full_name } : { full_name: 'Hospital' }
          };
        });
        items = items.map(t => ({
          ...t,
          hospital_profiles: hospMap[t.hospital_id] || { profiles: { full_name: 'Hospital' } }
        }));
      }

      let data = items;
      if (this.isSingle) {
        data = items.length > 0 ? items[0] : null;
      }

      const result = { data, error: null };
      return resolve ? resolve(result) : result;
    } catch (err) {
      console.error(`Firebase Query Error [${this.collectionName}]:`, err);
      const result = { data: null, error: err };
      return reject ? reject(err) : result;
    }
  }

  // INSERT
  async insert(dataOrArray) {
    const list = Array.isArray(dataOrArray) ? dataOrArray : [dataOrArray];
    const inserted = [];

    try {
      for (const item of list) {
        const itemCopy = { ...item };
        const id = itemCopy.id;
        delete itemCopy.id;

        if (!itemCopy.created_at) itemCopy.created_at = new Date().toISOString();
        if (!itemCopy.updated_at) itemCopy.updated_at = new Date().toISOString();

        if (id) {
          const dRef = doc(db, this.collectionName, id);
          await setDoc(dRef, itemCopy, { merge: true });
          inserted.push({ id, ...itemCopy });
        } else {
          const colRef = collection(db, this.collectionName);
          const docRef = await addDoc(colRef, itemCopy);
          inserted.push({ id: docRef.id, ...itemCopy });
        }
      }

      const res = {
        data: Array.isArray(dataOrArray) ? inserted : inserted[0],
        error: null,
        select: () => ({
          single: async () => ({ data: inserted[0], error: null })
        })
      };
      return res;
    } catch (err) {
      console.error(`Firebase Insert Error [${this.collectionName}]:`, err);
      return { data: null, error: err, select: () => ({ single: async () => ({ data: null, error: err }) }) };
    }
  }

  // UPSERT
  async upsert(data) {
    try {
      const dataCopy = { ...data };
      const id = dataCopy.id;
      delete dataCopy.id;

      if (!id) throw new Error("Document ID required for upsert");
      if (!dataCopy.updated_at) dataCopy.updated_at = new Date().toISOString();

      const dRef = doc(db, this.collectionName, id);
      await setDoc(dRef, dataCopy, { merge: true });
      return { data: { id, ...dataCopy }, error: null };
    } catch (err) {
      console.error(`Firebase Upsert Error [${this.collectionName}]:`, err);
      return { data: null, error: err };
    }
  }

  // UPDATE
  update(updates) {
    return {
      eq: async (field, value) => {
        try {
          const cleanUpdates = { ...updates, updated_at: new Date().toISOString() };
          if (field === 'id') {
            const dRef = doc(db, this.collectionName, value);
            await updateDoc(dRef, cleanUpdates);
            return { error: null };
          }

          // Query matching docs
          const q = query(collection(db, this.collectionName), where(field, '==', value));
          const snap = await getDocs(q);
          const promises = snap.docs.map(d => updateDoc(d.ref, cleanUpdates));
          await Promise.all(promises);
          return { error: null };
        } catch (err) {
          console.error(`Firebase Update Error [${this.collectionName}]:`, err);
          return { error: err };
        }
      }
    };
  }

  // DELETE
  delete() {
    return {
      eq: async (field, value) => {
        try {
          if (field === 'id') {
            await deleteDoc(doc(db, this.collectionName, value));
            return { error: null };
          }
          const q = query(collection(db, this.collectionName), where(field, '==', value));
          const snap = await getDocs(q);
          await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
          return { error: null };
        } catch (err) {
          console.error(`Firebase Delete Error [${this.collectionName}]:`, err);
          return { error: err };
        }
      }
    };
  }
}

// Unified client interface matching the legacy client pattern so dashboards & hooks keep 100% of their views and features intact
export const firebaseClient = {
  auth: {
    async getSession() {
      try {
        if (typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }
      } catch (e) {
        console.warn("Firebase authStateReady notice:", e);
      }

      const user = auth.currentUser;
      if (!user) return { data: { session: null }, error: null };
      return {
        data: {
          session: {
            user: {
              id: user.uid,
              email: user.email,
              user_metadata: {
                full_name: user.displayName || user.email?.split('@')[0]
              }
            }
          }
        },
        error: null
      };
    },

    async getUser() {
      try {
        if (typeof auth.authStateReady === 'function') {
          await auth.authStateReady();
        }
      } catch (e) {
        console.warn("Firebase authStateReady notice:", e);
      }

      const user = auth.currentUser;
      if (!user) return { data: { user: null }, error: null };
      return {
        data: {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: {
              full_name: user.displayName || user.email?.split('@')[0]
            }
          }
        },
        error: null
      };
    },

    async signInWithPassword({ email, password }) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        return {
          data: {
            user: {
              id: userCred.user.uid,
              email: userCred.user.email
            }
          },
          error: null
        };
      } catch (err) {
        return { data: null, error: err };
      }
    },

    async signUp({ email, password, options = {} }) {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const metadata = options.data || {};

        if (metadata.full_name) {
          await updateProfile(userCred.user, { displayName: metadata.full_name });
        }

        // Auto-create base profile doc in Firestore matching trigger behavior
        await setDoc(doc(db, 'profiles', userCred.user.uid), {
          id: userCred.user.uid,
          role: metadata.role || 'ambulance',
          full_name: metadata.full_name || '',
          phone: metadata.phone || '',
          employee_id: metadata.employee_id || '',
          organization_id: metadata.organization_id || '',
          status: 'verified',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { merge: true });

        return {
          data: {
            user: {
              id: userCred.user.uid,
              email: userCred.user.email
            }
          },
          error: null
        };
      } catch (err) {
        return { data: null, error: err };
      }
    },

    async signOut() {
      try {
        await fbSignOut(auth);
        return { error: null };
      } catch (err) {
        return { error: err };
      }
    },

    onAuthStateChange(callback) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          callback('SIGNED_IN', {
            user: {
              id: user.uid,
              email: user.email,
              user_metadata: { full_name: user.displayName }
            }
          });
        } else {
          callback('SIGNED_OUT', null);
        }
      });
      return {
        data: {
          subscription: {
            unsubscribe
          }
        }
      };
    }
  },

  from(collectionName) {
    return new QueryBuilder(collectionName);
  },

  channel(name) {
    if (!activeChannels.has(name)) {
      activeChannels.set(name, new RealtimeChannel(name));
    }
    return activeChannels.get(name);
  },

  removeChannel(channel) {
    if (!channel) return;
    if (typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
    if (channel.name) {
      activeChannels.delete(channel.name);
    }
  }
};

// Export as both firebaseClient and supabase alias for drop-in zero-breakage compatibility
export const supabase = firebaseClient;
export default firebaseClient;
