import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from './api';
import TeamDetails from './TeamDetails';
import Payment from './Payment';
import Success from './Success';
import './registrationStepper.css';

const STORAGE_KEY = 'hackathon-registration-draft-v1';
const SUCCESS_REDIRECT_DELAY_MS = 60000;
const SUCCESS_REDIRECT_URL = '/user/dashboard.html';

const initialForm = {
  teamName: '',
  teamLeaderName: '',
  email: '',
  year: '',
  stream: '',
  contactNumber: '',
  teamSize: '',
  teamMembers: [],
  paymentMethod: 'razorpay',
  paymentViewMode: 'scanner',
  paymentReference: '',
  transactionId: '',
  whatsappJoined: false,
  whatsappInviteLink: '',
  submissionConfirmed: false
};

const initialErrors = {
  teamName: '',
  teamLeaderName: '',
  email: '',
  year: '',
  stream: '',
  contactNumber: '',
  teamSize: '',
  teamMembers: [],
  transactionId: '',
  whatsappJoined: ''
};

function loadDraft() {
  if (typeof window === 'undefined') {
    return initialForm;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialForm;
    const parsed = JSON.parse(raw);
    return {
      ...initialForm,
      ...parsed,
      teamMembers: Array.isArray(parsed.teamMembers) ? parsed.teamMembers : []
    };
  } catch {
    return initialForm;
  }
}

function isValidPhone(value) {
  return /^[0-9]{10}$/.test(String(value || '').trim());
}

export default function RegistrationStepper({
  registerEndpoint = `${(import.meta.env.VITE_API_URL || 'https://event-management-frontend-og23.onrender.com').replace(/\/$/, '')}/api/register`,
  qrCodeSrc = '/assets/images/upi-qr.png',
  upiId = 'startinno@upi',
  whatsappInviteLink = ''
}) {
  const [showRegistration, setShowRegistration] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(loadDraft);
  const [errors, setErrors] = useState(initialErrors);
  const [submissionResult, setSubmissionResult] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState({ upiId, upiImageUrl: qrCodeSrc, whatsappGroupLink: whatsappInviteLink });

  const [whatsappLink, setWhatsappLink] = useState(whatsappInviteLink);
  const [successMeta, setSuccessMeta] = useState(null);
  const [successCountdown, setSuccessCountdown] = useState(SUCCESS_REDIRECT_DELAY_MS / 1000);
  const successRedirectHandledRef = useRef(false);
  const successRedirectTimerRef = useRef(null);

  useEffect(() => {
    if (!submissionResult) {
      setSuccessMeta(null);
      setSuccessCountdown(SUCCESS_REDIRECT_DELAY_MS / 1000);
      successRedirectHandledRef.current = false;
      if (successRedirectTimerRef.current) {
        window.clearTimeout(successRedirectTimerRef.current);
        successRedirectTimerRef.current = null;
      }
      return undefined;
    }

    successRedirectHandledRef.current = false;
    setSuccessCountdown(SUCCESS_REDIRECT_DELAY_MS / 1000);

    const countdownInterval = window.setInterval(() => {
      setSuccessCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    const redirectTimer = window.setTimeout(() => {
      if (successRedirectHandledRef.current) return;
      successRedirectHandledRef.current = true;
      window.clearInterval(countdownInterval);
      window.location.href = SUCCESS_REDIRECT_URL;
    }, SUCCESS_REDIRECT_DELAY_MS);

    successRedirectTimerRef.current = redirectTimer;

    return () => {
      window.clearInterval(countdownInterval);
      window.clearTimeout(redirectTimer);
    };
  }, [submissionResult]);

  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const response = await api.get('/api/banner/active');
        const data = response.data || {};
        const nextConfig = {
          upiId: String(data.upiId || upiId).trim(),
          upiImageUrl: String(data.upiImageUrl || qrCodeSrc).trim(),
          whatsappGroupLink: String(data.whatsappGroupLink || whatsappInviteLink).trim()
        };

        setPaymentConfig(nextConfig);
        if (nextConfig.whatsappGroupLink) {
          setWhatsappLink(nextConfig.whatsappGroupLink);
        }
      } catch (error) {
        console.error('[RegistrationStepper] Failed to fetch payment config:', error);
      }
    };
    fetchPaymentConfig();
  }, [qrCodeSrc, upiId, whatsappInviteLink]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const normalizedMembers = useMemo(() => {
    const requiredMembers = Math.max(Number(formData.teamSize || 0) - 1, 0);
    return Array.from({ length: requiredMembers }, (_, index) => {
      const m = formData.teamMembers[index];
      if (!m) return { name: '', phone: '', stream: '', year: '' };
      return typeof m === 'string' ? { name: m, phone: '', stream: '', year: '' } : m;
    });
  }, [formData.teamMembers, formData.teamSize]);

  const canProceedFromStepOne = useMemo(() => {
    const memberCount = Math.max(Number(formData.teamSize || 0) - 1, 0);
    const membersValid = memberCount === 0 || normalizedMembers.every((member) => member.name && isValidPhone(member.phone) && member.stream && member.year);
    return Boolean(
      formData.teamName.trim() &&
      formData.teamLeaderName.trim() &&
      formData.email.trim() &&
      formData.year &&
      formData.stream.trim() &&
      isValidPhone(formData.contactNumber) &&
      formData.teamSize &&
      membersValid
    );
  }, [formData, normalizedMembers]);

  useEffect(() => {
    if (!formData.teamSize) return;
    setFormData((current) => ({
      ...current,
      teamMembers: Array.from({ length: Math.max(Number(current.teamSize) - 1, 0) }, (_, index) => current.teamMembers[index] || { name: '', phone: '', stream: '', year: '' })
    }));
  }, [formData.teamSize]);

  function updateField(field, value, memberIndex) {
    setSubmitError('');
    if (field === 'teamMembers') {
      setFormData((current) => {
        const teamMembers = [...current.teamMembers];
        teamMembers[memberIndex] = value;
        return { ...current, teamMembers };
      });
      return;
    }

    setFormData((current) => ({ ...current, [field]: value }));
  }

  function validateStepOne() {
    const nextErrors = { ...initialErrors };
    const memberCount = Math.max(Number(formData.teamSize || 0) - 1, 0);

    if (!formData.teamName.trim()) nextErrors.teamName = 'Team name is required.';
    if (!formData.teamLeaderName.trim()) nextErrors.teamLeaderName = 'Team leader name is required.';
    if (!formData.email.trim()) nextErrors.email = 'Team leader email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!formData.year) nextErrors.year = 'Year is required.';
    if (!formData.stream.trim()) nextErrors.stream = 'Stream is required.';
    if (!isValidPhone(formData.contactNumber)) nextErrors.contactNumber = 'Enter a valid 10 digit contact number.';
    if (!formData.teamSize) nextErrors.teamSize = 'Select a team size.';
    if (memberCount > 0) {
      nextErrors.teamMembers = Array.from({ length: memberCount }, (_, index) => {
        const member = formData.teamMembers[index] || { name: '', phone: '', stream: '', year: '' };
        const err = { name: '', phone: '', stream: '', year: '' };
        if (!member.name || !member.name.trim()) err.name = `Member ${index + 1} name is required.`;
        if (!isValidPhone(member.phone)) err.phone = `Member ${index + 1} phone is invalid.`;
        if (!member.stream || !member.stream.trim()) err.stream = `Member ${index + 1} stream is required.`;
        if (!member.year) err.year = `Member ${index + 1} year is required.`;
        return err;
      });
    }

    setErrors((current) => ({ ...current, ...nextErrors }));

    const membersOk = memberCount === 0 || nextErrors.teamMembers.every((e) => !e.name && !e.phone && !e.stream && !e.year);

    return !nextErrors.teamName && !nextErrors.teamLeaderName && !nextErrors.email && !nextErrors.year && !nextErrors.stream && !nextErrors.contactNumber && !nextErrors.teamSize && membersOk;
  }

  function validateStepTwo(paymentOverride = null) {
    const paymentMethod = paymentOverride?.paymentMethod || formData.paymentMethod;
    const paymentReference = paymentOverride?.paymentReference || formData.paymentReference;
    const transactionId = paymentOverride?.transactionId || formData.transactionId.trim();
    const nextErrors = { ...initialErrors };

    if (paymentMethod === 'razorpay' && !paymentReference) {
      nextErrors.transactionId = 'Complete Razorpay payment first.';
    }

    if (paymentMethod === 'upi' && !transactionId) {
      nextErrors.transactionId = 'Please enter valid transaction ID';
    }

    setErrors((current) => ({ ...current, transactionId: nextErrors.transactionId }));
    return paymentMethod === 'razorpay' ? Boolean(paymentReference) : Boolean(transactionId);
  }

  function validateStepThree() {
    const nextErrors = { ...initialErrors, whatsappJoined: formData.whatsappJoined ? '' : 'Please confirm that you joined the WhatsApp group.' };
    setErrors((current) => ({ ...current, whatsappJoined: nextErrors.whatsappJoined }));
    return Boolean(formData.whatsappJoined);
  }

  async function handleNext(paymentOverride = null) {
    if (currentStep === 1) {
      if (!validateStepOne()) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (paymentOverride) {
        setFormData((current) => ({ ...current, ...paymentOverride }));
      }

      if (!validateStepTwo(paymentOverride)) return;
      // Skip the removed WhatsApp join step and go directly to success
      setCurrentStep(4);
      return;
    }

    if (currentStep === 3) {
      if (!validateStepThree()) return;
      setCurrentStep(4);
    }
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    if (!formData.submissionConfirmed) {
      setSubmitError('Please confirm that all details are correct before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        teamName: formData.teamName.trim(),
        teamLeaderName: formData.teamLeaderName.trim(),
        email: formData.email.trim().toLowerCase(),
        year: formData.year,
        stream: formData.stream.trim(),
        contactNumber: formData.contactNumber.trim(),
        teamSize: Number(formData.teamSize),
        teamMembers: normalizedMembers.map((member) => ({
          name: (member.name || '').trim(),
          phone: (member.phone || '').trim(),
          stream: (member.stream || '').trim(),
          year: member.year || ''
        })),
        transactionId: formData.transactionId.trim(),
        paymentMethod: formData.paymentMethod || 'upi',
        paymentReference: formData.paymentReference || formData.transactionId.trim(),
        whatsappJoined: formData.whatsappJoined,
        whatsappInviteLink: formData.whatsappInviteLink || whatsappInviteLink,
        submissionConfirmed: formData.submissionConfirmed
      };

      console.log('[RegistrationStepper] submit', registerEndpoint, payload);
      const response = await api.post(registerEndpoint, payload);
      const team = response.data?.team || {};
      const createdAt = team.createdAt || response.data?.createdAt || new Date().toISOString();
      const paymentStatus = String(team.paymentStatus || (formData.paymentReference || formData.transactionId ? 'pending' : 'pending')).trim() || 'pending';

      setSuccessMeta({
        registrationId: team._id || response.data?.registrationId || '',
        submittedAt: createdAt,
        paymentStatus,
        verificationMessage: 'Verification Pending - Your registration is under admin review.'
      });
      setSuccessCountdown(SUCCESS_REDIRECT_DELAY_MS / 1000);
      setSubmissionResult(response.data?.message || response.data?.msg || 'Registration completed successfully.');
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      const rawMessage = error.response?.data?.message || error.response?.data?.msg || 'Submission failed. Please try again.';
      const message = /duplicate candidate|already registered/i.test(rawMessage)
        ? 'Duplicate Candidate - This email is already registered.'
        : rawMessage;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function restart() {
    setShowRegistration(false);
    setCurrentStep(1);
    setFormData(initialForm);
    setErrors(initialErrors);
    setSubmitError('');
    setSubmissionResult('');
    setSuccessMeta(null);
    setSuccessCountdown(SUCCESS_REDIRECT_DELAY_MS / 1000);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function handleImmediateDashboardRedirect() {
    if (successRedirectHandledRef.current) return;
    successRedirectHandledRef.current = true;
    if (successRedirectTimerRef.current) {
      window.clearTimeout(successRedirectTimerRef.current);
      successRedirectTimerRef.current = null;
    }
    window.location.href = SUCCESS_REDIRECT_URL;
  }

  const variants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  if (!showRegistration) {
    return (
      <div className="registration-shell">
        <div className="registration-card registration-landing-card">
          <div className="step-panel__header">
            <p className="step-kicker">Registration</p>
            <h2>Start your entry</h2>
            <p>Click the register button to begin the step-by-step flow.</p>
          </div>
          <button className="btn-primary" type="button" onClick={() => setShowRegistration(true)}>
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-shell">
      <div className="registration-card">
        <div className="progress-bar">
          <div className="progress-copy">
            <span>Step {currentStep} of 4</span>
            <strong>{currentStep === 1 ? 'Team Details' : currentStep === 2 ? 'Payment' : currentStep === 3 ? 'WhatsApp Join' : 'Success'}</strong>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.min((currentStep / 4) * 100, 100)}%` }} />
          </div>
        </div>

        {submitError && <div className="error-banner">{submitError}</div>}

        <div className="step-stage-wrap">
          <AnimatePresence initial={false} mode="wait">
            {currentStep === 1 && (
              <motion.div key="step1" initial="enter" animate="center" exit="exit" variants={variants} transition={{ duration: 0.36 }}>
                <TeamDetails data={formData} errors={errors} onChange={updateField} onNext={handleNext} canNext={canProceedFromStepOne} />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial="enter" animate="center" exit="exit" variants={{ enter: { x: 300, opacity: 0 }, center: { x: 0, opacity: 1 }, exit: { x: -300, opacity: 0 } }} transition={{ duration: 0.36 }}>
                <Payment
                  data={formData}
                  errors={errors}
                  onChange={updateField}
                  onNext={handleNext}
                  canNext={formData.paymentMethod === 'razorpay' ? Boolean(formData.paymentReference) : Boolean(formData.transactionId.trim())}
                  qrCodeSrc={paymentConfig.upiImageUrl || qrCodeSrc}
                  upiId={paymentConfig.upiId || upiId}
                />
              </motion.div>
            )}

            {/* Step 3 (WhatsApp join) has been removed; the flow skips from Payment -> Success */}

            {currentStep === 4 && (
              <motion.div key="step4" initial="enter" animate="center" exit="exit" variants={variants} transition={{ duration: 0.36 }}>
                <Success
                  submissionResult={submissionResult}
                  successMeta={successMeta}
                  successCountdown={successCountdown}
                  onGoToStep={setCurrentStep}
                  onGoToDashboardNow={handleImmediateDashboardRedirect}
                  isSubmitting={isSubmitting}
                  onSubmit={handleSubmit}
                  submitError={submitError}
                  formData={formData}
                  onRestart={restart}
                  onConfirmChange={(checked) => updateField('submissionConfirmed', checked)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="footer-note">
          <p>Progress is saved automatically. Refreshing the page will not lose your data.</p>
        </div>
      </div>
    </div>
  );
}
