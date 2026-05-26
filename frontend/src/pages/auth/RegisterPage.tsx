import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Truck, Shield, Activity, Radar, 
  ChevronRight, ChevronLeft, CheckCircle2, 
  Eye, EyeOff, ArrowLeft
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { registerPersonnel, validateStep1, validateStep3 } from '../../lib/auth-logic';

type Role = 'ambulance' | 'police' | 'hospital' | 'control' | null;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step1Data, setStep1Data] = useState({
    fullName: '',
    email: '',
    phone: '',
    employeeId: '',
    password: '',
    confirmPassword: ''
  });

  const [step2Data, setStep2Data] = useState({
    orgId: ''
  });

  const [step3Data, setStep3Data] = useState<any>({
    unitId: '',
    vehicleReg: '',
    vehicleType: 'bls',
    equipment: [],
    licenseNumber: '',
    emergencyContact: '',
    badgeNumber: '',
    rank: 'constable',
    assignedJunctions: '',
    staffRole: 'nurse',
    hospitalName: '',
    traumaLevel: '3',
    totalBeds: '',
    availableBeds: '',
    emergencyLine: '',
    latitude: '',
    longitude: '',
    callsign: '',
    supervisorCode: '',
    department: 'dispatch',
    clearanceLevel: '1',
    consent: false
  });

  const nextStep = () => {
    if (step === 1) {
      const errors = validateStep1(step1Data);
      if (Object.keys(errors).length > 0) {
        setError(Object.values(errors)[0]);
        return;
      }
    }
    if (step === 2) {
      if (!role) {
        setError("Please select an operational role.");
        return;
      }
      if (!step2Data.orgId) {
        setError("Please select your assigned organization.");
        return;
      }
    }
    setError(null);
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(s => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await registerPersonnel(role!, step1Data, step2Data, step3Data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[1, 2, 3].map((s) => (
        <div 
          key={s} 
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-500",
            s <= step ? "bg-accent-cyan" : "bg-[#2a2a3a]"
          )} 
        />
      ))}
    </div>
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center p-6 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] bg-surface-elevated border border-border-glow rounded-large p-10 text-center"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-accent-cyan/10 flex items-center justify-center text-accent-cyan"
            >
              <CheckCircle2 size={48} strokeWidth={1.5} />
            </motion.div>
          </div>
          <h2 className="text-[24px] font-bold text-text-primary mb-4">CONFIRM YOUR EMAIL</h2>
          <p className="text-text-secondary leading-relaxed mb-8">
            An authentication link has been dispatched to <span className="text-accent-cyan font-medium">{step1Data.email}</span>. 
            Please verify your inbox and click the link to activate your operational credentials.
          </p>
          <div className="space-y-4">
            <Link to="/login" className="block">
              <Button variant="primary" className="w-full" size="lg">GO TO LOGIN</Button>
            </Link>
            <p className="text-[13px] text-text-muted">
              Didn't receive the email? <button onClick={handleSubmit} className="text-accent-cyan hover:underline">Resend verification link</button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.4)_0%,transparent_70%)]" />
      
      <div className="w-full max-w-[560px] z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[13px] text-text-muted hover:text-accent-cyan transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          BACK TO LANDING
        </Link>
        <div className="text-center mb-8">
          <Badge variant="cyan" className="mb-4">Step 0{step} / 03</Badge>
          <h1 className="text-[32px] font-bold text-text-primary tracking-tight">
            {step === 1 && "Verify Identity"}
            {step === 2 && "Select Operational Role"}
            {step === 3 && "Configure Operational Profile"}
          </h1>
          <p className="text-text-secondary mt-2">
            {step === 1 && "All personnel require admin-verified credentials."}
            {step === 2 && "Your role determines your dashboard and permissions."}
            {step === 3 && "Provide specific details for your operational unit."}
          </p>
        </div>

        {renderStepIndicator()}

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-surface-elevated border border-border-glow rounded-large p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        >
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-accent-crimson/10 border border-accent-crimson/20 text-accent-crimson text-[13px] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {step === 1 && <Step1 data={step1Data} setData={setStep1Data} onNext={nextStep} />}
          {step === 2 && <Step2 role={role} setRole={setRole} data={step2Data} setData={setStep2Data} onNext={nextStep} onPrev={prevStep} />}
          {step === 3 && <Step3 role={role} data={step3Data} setData={setStep3Data} onSubmit={handleSubmit} onPrev={prevStep} loading={loading} />}
        </motion.div>
      </div>
    </div>
  );
};

// --- Step Components ---

const Step1 = ({ data, setData, onNext }: { data: any, setData: any, onNext: () => void }) => {
  return (
    <div className="space-y-6">
      <Input 
        label="FULL LEGAL NAME" 
        placeholder="As per official records" 
        required 
        value={data.fullName}
        onChange={(e) => setData({ ...data, fullName: e.target.value })}
      />
      <Input 
        label="OFFICIAL EMAIL" 
        placeholder="personnel@agency.gov" 
        type="email" 
        required 
        value={data.email}
        onChange={(e) => setData({ ...data, email: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="PHONE NUMBER" 
          placeholder="+1 (555) 000-0000" 
          type="tel" 
          required 
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
        />
        <Input 
          label="EMPLOYEE / SERVICE ID" 
          placeholder="Official ID Number" 
          required 
          value={data.employeeId}
          onChange={(e) => setData({ ...data, employeeId: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input 
          label="PASSWORD" 
          type="password" 
          required 
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
        />
        <Input 
          label="CONFIRM PASSWORD" 
          type="password" 
          required 
          value={data.confirmPassword}
          onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
        />
      </div>
      <div className="pt-4">
        <Button variant="primary" className="w-full" size="lg" onClick={onNext}>
          PROCEED TO ROLE SETUP <ChevronRight size={18} className="ml-2" />
        </Button>
        <Link to="/login" className="block text-center mt-6 text-[14px] text-text-muted hover:text-text-primary">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
};

const Step2 = ({ role, setRole, data, setData, onNext, onPrev }: { role: Role, setRole: (r: Role) => void, data: any, setData: any, onNext: () => void, onPrev: () => void }) => {
  const roles = [
    { id: 'ambulance', title: 'Ambulance Driver', icon: Truck, color: 'cyan', desc: 'Field navigation, patient transport' },
    { id: 'police', title: 'Police Officer', icon: Shield, color: 'amber', desc: 'Junction clearance, corridor control' },
    { id: 'hospital', title: 'Hospital Staff', icon: Activity, color: 'crimson', desc: 'Patient intake, ER capacity' },
    { id: 'control', title: 'Control Room', icon: Radar, color: 'violet', desc: 'Operational oversight, dispatch' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setRole(r.id as Role)}
            className={cn(
              "p-4 rounded-xl border transition-all duration-300 text-left group",
              role === r.id 
                ? "bg-surface-primary border-accent-cyan shadow-[0_0_20px_rgba(0,0,0,0.3)]" 
                : "border-[#2a2a3a] hover:border-text-muted bg-transparent",
              role === 'ambulance' && r.id === 'ambulance' && "border-accent-cyan",
              role === 'police' && r.id === 'police' && "border-accent-amber",
              role === 'hospital' && r.id === 'hospital' && "border-accent-crimson",
              role === 'control' && r.id === 'control' && "border-accent-violet"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mb-4 border",
              role === r.id ? "" : "border-[#2a2a3a] text-text-muted group-hover:text-text-secondary",
              r.id === 'ambulance' && (role === 'ambulance' ? "border-accent-cyan text-accent-cyan" : ""),
              r.id === 'police' && (role === 'police' ? "border-accent-amber text-accent-amber" : ""),
              r.id === 'hospital' && (role === 'hospital' ? "border-accent-crimson text-accent-crimson" : ""),
              r.id === 'control' && (role === 'control' ? "border-accent-violet text-accent-violet" : "")
            )}>
              <r.icon size={20} />
            </div>
            <div className="font-bold text-text-primary mb-1">{r.title}</div>
            <div className="text-[12px] text-text-muted leading-tight">{r.desc}</div>
          </button>
        ))}
      </div>

      {role && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Select 
            label={
              role === 'ambulance' ? "Ambulance Unit / Fleet ID" :
              role === 'police' ? "Police Station / Precinct ID" :
              role === 'hospital' ? "Hospital Facility" : "Command Center ID"
            } 
            required
            value={data.orgId}
            onChange={(e) => setData({ ...data, orgId: e.target.value })}
          >
            <option value="">Select organization...</option>
            <option value="1">Metro General Central</option>
            <option value="2">City West Precinct</option>
            <option value="3">Fleet Alpha Dispatch</option>
          </Select>
        </motion.div>
      )}

      <div className="flex gap-4 pt-4">
        <Button variant="secondary" className="flex-1" size="lg" onClick={onPrev}>
          <ChevronLeft size={18} className="mr-2" /> BACK
        </Button>
        <Button variant="primary" className="flex-[2]" size="lg" disabled={!role} onClick={onNext}>
          CONFIGURE ROLE DETAILS <ChevronRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

const Step3 = ({ role, data, setData, onSubmit, onPrev, loading }: { role: Role, data: any, setData: any, onSubmit: (e: React.FormEvent) => void, onPrev: () => void, loading: boolean }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {role === 'ambulance' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="AMBULANCE UNIT ID" 
              placeholder="e.g. AMB-204" 
              required 
              value={data.unitId}
              onChange={(e) => setData({ ...data, unitId: e.target.value })}
            />
            <Input 
              label="VEHICLE REGISTRATION" 
              placeholder="ABC-1234" 
              required 
              value={data.vehicleReg}
              onChange={(e) => setData({ ...data, vehicleReg: e.target.value })}
            />
          </div>
          <Select 
            label="VEHICLE TYPE" 
            required
            value={data.vehicleType}
            onChange={(e) => setData({ ...data, vehicleType: e.target.value })}
          >
            <option value="bls">Basic Life Support (BLS)</option>
            <option value="als">Advanced Life Support (ALS)</option>
            <option value="neonatal">Neonatal</option>
          </Select>
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-text-secondary">EQUIPMENT ONBOARD</label>
            <div className="flex flex-wrap gap-2">
              {['Defibrillator', 'Oxygen', 'Ventilator', 'Trauma Kit'].map(tag => (
                <button 
                  type="button" 
                  key={tag} 
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-[13px] transition-colors",
                    data.equipment?.includes(tag)
                      ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10"
                      : "border-[#2a2a3a] text-text-secondary hover:border-accent-cyan hover:text-accent-cyan"
                  )}
                  onClick={() => {
                    const equipment = data.equipment || [];
                    if (equipment.includes(tag)) {
                      setData({ ...data, equipment: equipment.filter((t: string) => t !== tag) });
                    } else {
                      setData({ ...data, equipment: [...equipment, tag] });
                    }
                  }}
                >
                  {data.equipment?.includes(tag) ? "✓ " : "+ "} {tag}
                </button>
              ))}
            </div>
          </div>
          <Input 
            label="DRIVER LICENSE NUMBER" 
            placeholder="Official License ID" 
            required 
            value={data.licenseNumber}
            onChange={(e) => setData({ ...data, licenseNumber: e.target.value })}
          />
          <Input 
            label="EMERGENCY CONTACT" 
            placeholder="+1 (555) 999-9999" 
            required 
            value={data.emergencyContact}
            onChange={(e) => setData({ ...data, emergencyContact: e.target.value })}
          />
        </>
      )}

      {role === 'police' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="POLICE UNIT ID" 
              placeholder="e.g. P-105" 
              required 
              value={data.unitId}
              onChange={(e) => setData({ ...data, unitId: e.target.value })}
            />
            <Input 
              label="BADGE NUMBER" 
              placeholder="88219" 
              required 
              value={data.badgeNumber}
              onChange={(e) => setData({ ...data, badgeNumber: e.target.value })}
            />
          </div>
          <Select 
            label="RANK / DESIGNATION" 
            required
            value={data.rank}
            onChange={(e) => setData({ ...data, rank: e.target.value })}
          >
            <option value="constable">Constable</option>
            <option value="inspector">Inspector</option>
            <option value="si">Sub-Inspector</option>
          </Select>
          <Input 
            label="ASSIGNED JUNCTIONS" 
            placeholder="e.g. JN-102, JN-405" 
            required 
            value={data.assignedJunctions}
            onChange={(e) => setData({ ...data, assignedJunctions: e.target.value })}
          />
        </>
      )}

      {role === 'hospital' && (
        <>
          <Input 
            label="HOSPITAL / FACILITY NAME" 
            placeholder="e.g. Metro General Central" 
            required 
            value={data.hospitalName || ''}
            onChange={(e) => setData({ ...data, hospitalName: e.target.value })}
          />
          <Select 
            label="STAFF ROLE" 
            required
            value={data.staffRole}
            onChange={(e) => setData({ ...data, staffRole: e.target.value })}
          >
            <option value="coord">ER Coordinator</option>
            <option value="nurse">Triage Nurse</option>
            <option value="doctor">Duty Doctor</option>
          </Select>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="TOTAL BEDS" 
              type="number" 
              required 
              value={data.totalBeds}
              onChange={(e) => setData({ ...data, totalBeds: e.target.value })}
            />
            <Input 
              label="AVAILABLE BEDS" 
              type="number" 
              required 
              value={data.availableBeds}
              onChange={(e) => setData({ ...data, availableBeds: e.target.value })}
            />
          </div>
          <Select 
            label="TRAUMA LEVEL" 
            required
            value={data.traumaLevel}
            onChange={(e) => setData({ ...data, traumaLevel: e.target.value })}
          >
            <option value="1">Level I (Comprehensive)</option>
            <option value="2">Level II</option>
            <option value="3">Level III</option>
          </Select>
          <Input 
            label="EMERGENCY LINE" 
            placeholder="Direct hospital ER line" 
            required 
            value={data.emergencyLine}
            onChange={(e) => setData({ ...data, emergencyLine: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="HOSPITAL LATITUDE" 
              placeholder="e.g. 40.7306" 
              type="number"
              step="any"
              required 
              value={data.latitude}
              onChange={(e) => setData({ ...data, latitude: e.target.value })}
            />
            <Input 
              label="HOSPITAL LONGITUDE" 
              placeholder="e.g. -73.9352" 
              type="number"
              step="any"
              required 
              value={data.longitude}
              onChange={(e) => setData({ ...data, longitude: e.target.value })}
            />
          </div>
        </>
      )}

      {role === 'control' && (
        <>
          <Input 
            label="OPERATOR CALLSIGN" 
            placeholder="e.g. CTRL-01" 
            required 
            value={data.callsign}
            onChange={(e) => setData({ ...data, callsign: e.target.value })}
          />
          <Input 
            label="SUPERVISOR AUTHORIZATION CODE" 
            type="password" 
            placeholder="••••••••" 
            required 
            value={data.supervisorCode}
            onChange={(e) => setData({ ...data, supervisorCode: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="DEPARTMENT" 
              required
              value={data.department}
              onChange={(e) => setData({ ...data, department: e.target.value })}
            >
              <option value="dispatch">Dispatch</option>
              <option value="ops">Operations</option>
            </Select>
            <Select 
              label="CLEARANCE LEVEL" 
              required
              value={data.clearanceLevel}
              onChange={(e) => setData({ ...data, clearanceLevel: e.target.value })}
            >
              <option value="1">Level 1 (View)</option>
              <option value="2">Level 2 (Assign)</option>
              <option value="3">Level 3 (Full)</option>
            </Select>
          </div>
        </>
      )}

      <div className="space-y-4 pt-4">
        <Checkbox 
          label="I consent to live operational monitoring and data sharing as mandated by agency protocols." 
          required 
          checked={data.consent}
          onChange={(e) => setData({ ...data, consent: e.target.checked })}
        />
        
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1" size="lg" onClick={onPrev} type="button">
            BACK
          </Button>
          <Button variant="primary" className="flex-[2]" size="lg" type="submit" disabled={loading}>
            {loading ? "SUBMITTING..." : "COMPLETE REGISTRATION"}
          </Button>
        </div>
      </div>
    </form>
  );
};
