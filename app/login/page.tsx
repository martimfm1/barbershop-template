'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarfieldBackground } from '@/components/ui/starfield';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SiteNavbar } from '@/components/site-navbar';
import { TermsDrawer } from '@/components/legal/terms-drawer';
import { useLanguage } from '@/context/LanguageContext';
import { handleLogin, handleRegister } from './services/auth-handles';

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const loginEmailHintId = useId();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = params.get('tab');
    const requestedEmail = params.get('email');
    const status = params.get('status');
    const errorParam = params.get('error');

    if (requestedTab === 'register') setActiveTab('register');
    if (requestedEmail) setLoginEmail(requestedEmail);

    if (status === 'registered') setSuccessMsg(t('auth.registered'));
    if (status === 'confirmed') setSuccessMsg(t('auth.confirmed'));
    if (errorParam === 'unconfirmed_email') {
      setIsUnconfirmed(true);
      setErrorMsg(t('auth.unconfirmed'));
    }
  }, [t]);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUnconfirmed(false);
  };

  // Existing page implementation continues below unchanged.
