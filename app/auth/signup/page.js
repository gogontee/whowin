// /app/auth/signup/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Star, 
  Shield,
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  Award,
  Users,
  Crown,
  MapPin,
  Upload,
  Camera,
  ChevronDown,
  Search,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Home,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Custom Searchable Select Component
const SearchableSelect = ({
  id,
  name,
  value,
  onChange,
  options,
  placeholder,
  label,
  required,
  disabled,
  loading,
  error,
  icon: Icon,
  onBlur
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setSearchTerm(option);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange({ target: { name, value: val } });
    if (!isOpen) setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm(value || '');
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        if (onBlur) onBlur();
      }
    }, 200);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label htmlFor={id} className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
        {Icon && <Icon className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />} 
        <span>{label}</span> 
        {required && <span className="text-[#C58B2A]">*</span>}
      </label>
      
      <div className="relative w-full">
        <div className={`relative w-full bg-white/5 border rounded-lg md:rounded-xl transition-all ${
          error ? 'border-red-400 bg-red-500/10' : 
          value ? 'border-green-400 bg-green-500/10' : isOpen ? 'border-[#C58B2A] ring-1 ring-[#C58B2A]/50' : 'border-white/20 hover:border-white/40'
        }`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 text-white/30 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id={id}
            name={name}
            value={searchTerm || value || ''}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled || loading}
            className="w-full pl-7 pr-8 py-2 md:py-2.5 bg-transparent text-sm md:text-base text-white placeholder-white/30 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
            disabled={disabled || loading}
          >
            <ChevronDown className={`w-3 h-3 md:w-3.5 md:h-3.5 text-white/40 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {loading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-[#C58B2A] border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 w-full mt-1 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="relative p-2 border-b border-white/5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-white/30 border border-white/10 focus:border-[#C58B2A] focus:outline-none transition-colors"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-48 md:max-h-56 overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-2 text-left text-xs md:text-sm text-white hover:text-[#C58B2A] hover:bg-green-500/10 transition-all duration-150 ${
                      option === value ? 'bg-[#C58B2A]/10 text-[#C58B2A]' : ''
                    }`}
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-white/30 text-xs">
                  No results found
                </div>
              )}
            </div>

            {searchTerm && !filteredOptions.includes(searchTerm) && (
              <div className="px-4 py-2 border-t border-white/5 bg-white/5">
                <p className="text-[8px] md:text-[9px] text-white/30 flex items-center gap-1">
                  <span className="text-[#C58B2A]/70">Tip:</span> Type a custom value and press Enter or click outside to save
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.6);
        }
      `}</style>
    </div>
  );
};

export default function SignupPage() {
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [switchingRole, setSwitchingRole] = useState(false);
  
  // Fan registration disabled state
  const [showFanDisabledModal, setShowFanDisabledModal] = useState(false);
  const [showWhatsappNotice, setShowWhatsappNotice] = useState(false);
  const [whatsappNoticeDismissed, setWhatsappNoticeDismissed] = useState(false);

  const dismissWhatsappNotice = () => {
    setWhatsappNoticeDismissed(true);
    setShowWhatsappNotice(false);
  };
  
  // Avatar guidance modal
  const [showAvatarGuidance, setShowAvatarGuidance] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [exampleImages, setExampleImages] = useState([
    '/passport1.jpeg',
    '/passport2.jpg'
  ]);
  
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: '',
    state: '',
    city: '',
    lga: '',
    avatarUrl: '',
    agreeTerms: false
  });
  
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
    minLength: false,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Auto-rotate example images
  useEffect(() => {
    if (!showAvatarGuidance) return;
    
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % exampleImages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [showAvatarGuidance, exampleImages.length]);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('whowin_signup_form');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsed }));
        if (parsed.selectedRole) {
          setSelectedRole(parsed.selectedRole);
        }
        if (parsed.avatarPreview) {
          setAvatarPreview(parsed.avatarPreview);
        }
      } catch (e) {
        console.error('Error loading saved form data:', e);
      }
    }
    setFormInitialized(true);
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (!formInitialized) return;
    
    const dataToSave = {
      ...formData,
      selectedRole: selectedRole,
      avatarPreview: avatarPreview
    };
    localStorage.setItem('whowin_signup_form', JSON.stringify(dataToSave));
  }, [formData, selectedRole, avatarPreview, formInitialized]);

  // Clear saved data when signup is successful
  useEffect(() => {
    if (success) {
      localStorage.removeItem('whowin_signup_form');
    }
  }, [success]);

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('state')
        .order('state');
      
      if (error) throw error;
      
      const uniqueStates = [...new Set(data.map(item => item.state))];
      setStates(uniqueStates);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.state && formData.country?.toLowerCase() === 'nigeria') {
      fetchCities(formData.state);
    } else {
      setCities([]);
    }
  }, [formData.state, formData.country]);

  const fetchCities = async (stateName) => {
    setLoadingCities(true);
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('cities')
        .eq('state', stateName)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data?.cities) {
        const citiesData = typeof data.cities === 'string' 
          ? JSON.parse(data.cities) 
          : data.cities;
        const cityNames = citiesData.map(item => item.name);
        const uniqueCityNames = [...new Set(cityNames)];
        setCities(uniqueCityNames);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // Cooldown countdown effect
  useEffect(() => {
    if (!cooldownUntil) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
      
      if (remaining <= 0) {
        setCooldownUntil(null);
        setCooldownSeconds(0);
        clearInterval(interval);
      } else {
        setCooldownSeconds(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Check password strength
  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      score: password.length > 0 ? Math.min(4, Math.floor(password.length / 2)) : 0,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
      minLength: password.length >= 8,
    });
  };

  // Check username availability
  useEffect(() => {
    let isMounted = true;
    
    const checkUsername = async () => {
      const usernameToCheck = formData.username.trim();
      
      if (usernameToCheck.length < 3) {
        if (isMounted) {
          setUsernameAvailable(null);
          setCheckingUsername(false);
        }
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
        if (isMounted) {
          setUsernameAvailable(null);
          setCheckingUsername(false);
        }
        return;
      }

      if (usernameToCheck.includes('@')) {
        if (isMounted) {
          setUsernameAvailable(null);
          setCheckingUsername(false);
        }
        return;
      }

      setCheckingUsername(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', usernameToCheck)
          .maybeSingle();

        if (error) {
          console.error('Username check error:', error);
          if (isMounted) {
            setUsernameAvailable(null);
          }
        } else if (data) {
          if (isMounted) setUsernameAvailable(false);
        } else {
          if (isMounted) setUsernameAvailable(true);
        }
      } catch (error) {
        console.error('Username check error:', error);
        if (isMounted) {
          setUsernameAvailable(null);
        }
      } finally {
        if (isMounted) setCheckingUsername(false);
      }
    };

    const timer = setTimeout(() => {
      checkUsername();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData.username, supabase]);

  // Handle fan disabled modal actions
  const handleFanModalAction = (action) => {
    setShowFanDisabledModal(false);
    if (action === 'home') {
      router.push('/');
    } else if (action === 'contest') {
      // Switch to candidate registration
      setSelectedRole('candidate');
      setFormData(prev => ({
        ...prev,
        username: prev.username || '',
        phone: prev.phone || '',
        country: prev.country || '',
        state: prev.state || '',
        city: prev.city || '',
        lga: prev.lga || '',
      }));
    }
  };

  // Handle role switch
  const handleRoleSwitch = (role) => {
    // If fan is selected, show disabled modal
    if (role === 'fan') {
      setShowFanDisabledModal(true);
      return;
    }
    
    setSwitchingRole(true);
    setSelectedRole(role);
    setFormData(prev => ({
      ...prev,
      username: role === 'candidate' ? prev.username : '',
      phone: role === 'candidate' ? prev.phone : '',
      country: role === 'candidate' ? prev.country : '',
      state: role === 'candidate' ? prev.state : '',
      city: role === 'candidate' ? prev.city : '',
      lga: role === 'candidate' ? prev.lga : '',
    }));
    setTimeout(() => setSwitchingRole(false), 300);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedRole === 'candidate') {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      } else if (usernameAvailable === false) {
        newErrors.username = 'Username is already taken. Please choose a different one.';
      }
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (selectedRole === 'candidate') {
      if (!formData.phone) {
        newErrors.phone = 'Whatsapp number is required';
      } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    if (selectedRole === 'candidate') {
      if (!formData.country) {
        newErrors.country = 'Country is required';
      }
      if (!formData.state) {
        newErrors.state = 'State is required';
      }
      if (!formData.city) {
        newErrors.city = 'City is required';
      }
    }
    
    const { hasLower, hasUpper, hasNumber, minLength } = passwordStrength;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!minLength || !hasLower || !hasUpper || !hasNumber) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'username') {
      const formattedValue = value
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData(prev => ({ ...prev, password }));
    checkPasswordStrength(password);
    
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Handle avatar upload button click - show guidance first
  const handleAvatarUploadClick = () => {
    setShowAvatarGuidance(true);
  };

  // Handle avatar upload from guidance modal
  const handleAvatarUploadFromGuidance = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setShowAvatarGuidance(false);
    };
    reader.readAsDataURL(file);
    setUploadingAvatar(false);
    setErrors(prev => ({ ...prev, avatar: '' }));
  };

  // Upload avatar to storage
  const uploadAvatar = async (file, userId) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (selectedRole === 'candidate' && usernameAvailable !== true) {
      setErrors(prev => ({
        ...prev,
        username: 'Please wait for username availability check or choose a different username.'
      }));
      return;
    }
    
    if (cooldownSeconds > 0) {
      setErrors(prev => ({
        ...prev,
        submit: `Please wait ${cooldownSeconds} seconds before trying again.`
      }));
      return;
    }
    
    setLoading(true);
    setErrors(prev => ({ ...prev, submit: '' }));
    
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: selectedRole === 'candidate' ? formData.username : null,
            full_name: formData.fullName,
            phone: formData.phone || '',
            country: formData.country || '',
            state: formData.state || '',
            city: formData.city || '',
            lga: selectedRole === 'candidate' ? formData.lga : null,
            role: selectedRole === 'candidate' ? 'user' : 'fan',
            avatar_url: null,
            accept_terms: formData.agreeTerms
          }
        }
      });
      
      if (signUpError) {
        console.error('Signup error details:', signUpError);
        
        if (signUpError.status === 429 || signUpError.message.includes('security purposes') || signUpError.message.includes('rate limit')) {
          const waitTime = 60;
          setCooldownUntil(Date.now() + (waitTime * 1000));
          
          setErrors(prev => ({
            ...prev,
            submit: `Too many signup attempts. Please wait ${waitTime} seconds.`
          }));
          setLoading(false);
          return;
        }
        
        if (signUpError.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please log in instead.');
        } else if (signUpError.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 8 characters long.');
        }
        throw signUpError;
      }
      
      if (!authData?.user) {
        throw new Error('Failed to create user account');
      }

      const userId = authData.user.id;

      let profileCreated = false;
      let attempts = 0;
      const maxAttempts = 10;
      let profileData = null;
      
      while (!profileCreated && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (!error && data) {
          profileCreated = true;
          profileData = data;
        }
      }

      if (!profileCreated) {
        throw new Error('Profile creation failed. Please try again.');
      }

      // Update profile with accept_terms if not already set
      if (formData.agreeTerms) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            accept_terms: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating accept_terms:', updateError);
        }
      }

      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${userId}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('profiles')
            .upload(filePath, avatarFile, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (uploadError) {
            console.error('Avatar upload error:', uploadError);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('profiles')
              .getPublicUrl(filePath);
            
            if (publicUrl) {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                  avatar_url: publicUrl,
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
              
              if (updateError) {
                console.error('Avatar URL update error:', updateError);
              } else {
                console.log('Avatar URL updated successfully:', publicUrl);
              }
            }
          }
        } catch (uploadError) {
          console.error('Avatar upload process error:', uploadError);
        }
      }

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('Auto-login error:', signInError);
          setSuccess(true);
          setTimeout(() => {
            router.push('/auth/login?email=' + encodeURIComponent(formData.email));
          }, 3000);
          return;
        }
      } catch (loginError) {
        console.error('Auto-login error:', loginError);
      }

      setSuccess(true);
      
      setTimeout(() => {
        if (selectedRole === 'candidate' && formData.username) {
          router.push(`/${formData.username}`);
        } else {
          router.push('/');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Signup error:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'An error occurred during signup. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    const { hasLower, hasUpper, hasNumber, minLength } = passwordStrength;
    const checks = [hasLower, hasUpper, hasNumber, minLength].filter(Boolean).length;
    
    if (checks <= 2) return "bg-[#C58B2A]";
    if (checks <= 3) return "bg-[#A96F1F]";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    const { hasLower, hasUpper, hasNumber, minLength } = passwordStrength;
    const checks = [hasLower, hasUpper, hasNumber, minLength].filter(Boolean).length;
    
    if (checks <= 2) return "Weak";
    if (checks <= 3) return "Medium";
    return "Strong";
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-3 py-4 md:px-4 md:py-6 relative overflow-hidden">
      {/* Background decor - gold/yellow sparks */}
      {Array.from({ length: 15 }, (_, index) => ({
        id: index,
        x: (index * 13) % 90 + 5,
        y: (index * 17) % 90 + 5,
        size: (index % 3) * 6 + 8,
        duration: (index % 5) * 2 + 10,
        delay: (index % 4) * 0.3,
      })).map((star) => (
        <motion.div
          key={star.id}
          className="absolute pointer-events-none hidden md:block"
          initial={{ 
            x: `${star.x}vw`, 
            y: `${star.y}vh`,
            scale: 0,
            opacity: 0.2
          }}
          animate={{ 
            y: [`${star.y}vh`, `${star.y - 15}vh`, `${star.y}vh`],
            x: [`${star.x}vw`, `${star.x + 8}vw`, `${star.x}vw`],
            rotate: [0, 180, 360],
            scale: [0, 0.8, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Sparkles 
            size={star.size} 
            className="text-[#C58B2A]/20"
          />
        </motion.div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          className="relative backdrop-blur-xl bg-white/5 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-white/10"
        >
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              boxShadow: [
                "0 0 15px rgba(250, 204, 21, 0.05), inset 0 0 15px rgba(250, 204, 21, 0.02)",
                "0 0 25px rgba(250, 204, 21, 0.08), inset 0 0 20px rgba(250, 204, 21, 0.05)",
                "0 0 15px rgba(250, 204, 21, 0.05), inset 0 0 15px rgba(250, 204, 21, 0.02)",
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Header with Logo */}
          <div className="bg-black/50 backdrop-blur-sm flex items-center justify-between py-3 px-4 border-b border-white/10">
            <motion.div
              initial={{ y: -2, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative flex-shrink-0"
            >
              <div className="relative w-32 h-14 md:w-40 md:h-16">
                <Image
                  src="/logo.png"
                  alt="WhoWin Logo"
                  fill
                  sizes="(max-width: 768px) 128px, 160px"
                  className="object-contain"
                  priority
                />
              </div>
            </motion.div>
            
            {/* Role Switch Buttons */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('candidate')}
                  className={`px-2 py-1 rounded-md text-[9px] md:text-[10px] font-medium transition-all flex items-center gap-1 ${
                    selectedRole === 'candidate'
                      ? 'bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Crown className="w-3 h-3 flex-shrink-0" />
                  <span>Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('fan')}
                  className={`px-2 py-1 rounded-md text-[9px] md:text-[10px] font-medium transition-all flex items-center gap-1 opacity-50 cursor-not-allowed ${
                    selectedRole === 'fan'
                      ? 'bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] text-black'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title="Fan registration is currently disabled"
                >
                  <Users className="w-3 h-3 flex-shrink-0" />
                  <span>Fan</span>
                  <span className="text-[6px] bg-[#C58B2A]/20 text-[#C58B2A] px-1 rounded">Soon</span>
                </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 md:p-8 space-y-4 md:space-y-5">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-center"
            >
              <h2 className="text-xl md:text-2xl font-bold text-[#C58B2A]">
                {selectedRole === 'candidate' ? 'Create Your Profile' : 'Join as a Fan'}
              </h2>
              <p className="text-xs md:text-sm text-white/60">
                {selectedRole === 'candidate' 
                  ? 'Carefully fill the form below to create your profile page.'
                  : 'Support your favorite contestants'}
              </p>
            </motion.div>

            {/* Auto-save indicator */}
            {formInitialized && !success && (
              <div className="flex items-center justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C58B2A]/50 animate-pulse flex-shrink-0"></div>
                <span className="text-[8px] text-white/20">Auto-saving...</span>
              </div>
            )}

            {/* Rate Limit Warning */}
            <AnimatePresence>
              {cooldownSeconds > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-[#C58B2A]/10 border border-[#C58B2A]/20 rounded-lg p-2 text-center"
                >
                  <p className="text-[#C58B2A] text-xs flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    Too many signup attempts. Please wait {cooldownSeconds} seconds.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* Username - Only for candidates */}
              {selectedRole === 'candidate' && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full"
                >
                  <label htmlFor="username" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                    <User className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                    <span>Nickname</span> 
                    <span className="text-[#C58B2A]">*</span>
                  </label>
                  <div className="relative w-full">
                    <input
                      type="text"
                      id="username"
                      name="username"
                      placeholder="e.g. stargirl, celeb_joe"
                      className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 pr-8 ${
                        errors.username ? 'border-red-400 bg-red-500/10' : 
                        usernameAvailable === true && formData.username.length >= 3 ? 'border-green-400 bg-green-500/10' :
                        usernameAvailable === false && formData.username.length >= 3 ? 'border-red-400 bg-red-500/10' : 
                        formData.username.length >= 3 ? 'border-white/20' : 'border-white/20'
                      }`}
                      value={formData.username}
                      onChange={handleChange}
                      required
                      minLength={3}
                      disabled={cooldownSeconds > 0}
                    />
                    
                    {checkingUsername && (
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <div className="w-3 h-3 border-2 border-[#C58B2A] border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      </div>
                    )}
                    
                    {!checkingUsername && usernameAvailable === true && formData.username.length >= 3 && (
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      </div>
                    )}
                    
                    {!checkingUsername && usernameAvailable === false && formData.username.length >= 3 && (
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <X className="w-3 h-3 text-red-500 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  
                  {errors.username && (
                    <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                      {errors.username}
                    </p>
                  )}
                  
                  {checkingUsername && formData.username.length >= 3 && (
                    <p className="mt-0.5 text-[8px] md:text-[10px] text-white/40 flex items-center gap-1">
                      <div className="w-2 h-2 border-2 border-[#C58B2A] border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                      Checking username availability...
                    </p>
                  )}
                  
                  {!checkingUsername && usernameAvailable === true && formData.username.length >= 3 && !errors.username && (
                    <p className="mt-0.5 text-[9px] md:text-xs text-green-400 flex items-center gap-1 animate-pulse">
                      <Check className="w-2.5 h-2.5 flex-shrink-0" />
                      ✓ Username is available!
                    </p>
                  )}
                  
                  {!checkingUsername && usernameAvailable === false && formData.username.length >= 3 && !errors.username && (
                    <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                      <X className="w-2.5 h-2.5 flex-shrink-0" />
                      ✗ Username is already taken. Please choose a different one.
                    </p>
                  )}
                  
                  {formData.username.length > 0 && formData.username.length < 3 && (
                    <p className="mt-0.5 text-[8px] md:text-[10px] text-[#C58B2A] flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                      Minimum 3 characters required
                    </p>
                  )}
                  
                  {formData.username.length >= 3 && !/^[a-zA-Z0-9_]+$/.test(formData.username) && (
                    <p className="mt-0.5 text-[8px] md:text-[10px] text-[#C58B2A] flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                      Only letters, numbers, and underscores allowed
                    </p>
                  )}
                </motion.div>
              )}

              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full"
              >
                  <label htmlFor="fullName" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                  <Award className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                  <span>Full Name</span> 
                  <span className="text-[#C58B2A]">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 ${
                    errors.fullName ? 'border-red-400 bg-red-500/10' : formData.fullName ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                  }`}
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={cooldownSeconds > 0}
                />
                {errors.fullName && (
                  <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    {errors.fullName}
                  </p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full"
              >
                  <label htmlFor="email" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                  <Mail className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                  <span>Email</span> 
                  <span className="text-[#C58B2A]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 ${
                    errors.email ? 'border-red-400 bg-red-500/10' : formData.email ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={cooldownSeconds > 0}
                />
                {errors.email && (
                  <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    {errors.email}
                  </p>
                )}
              </motion.div>

              {/* Phone - Required for candidates */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
                className="w-full"
              >
                <label htmlFor="phone" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                  <Phone className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                  <span>{selectedRole === 'candidate' ? 'Whatsapp Number' : 'Phone (Optional)'}</span>
                  {selectedRole === 'candidate' && <span className="text-[#C58B2A]">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder={selectedRole === 'candidate' ? '+234 800 000 0000' : '+123 456 7890 (optional)'}
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 ${
                      errors.phone ? 'border-red-400 bg-red-500/10' : formData.phone ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                    }`}
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => {
                      if (!whatsappNoticeDismissed) setShowWhatsappNotice(true);
                    }}
                    onClick={() => {
                      if (!whatsappNoticeDismissed) setShowWhatsappNotice(true);
                    }}
                    required={selectedRole === 'candidate'}
                    disabled={cooldownSeconds > 0}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    {errors.phone}
                  </p>
                )}
              </motion.div>

              {/* Avatar Upload */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full"
              >
                <label className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-white/60 mb-0.5 ml-1">
                  <Camera className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                  <span>Profile Picture</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 md:w-8 md:h-8 text-white/30 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={handleAvatarUploadClick}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs md:text-sm text-white transition-colors inline-flex items-center gap-2"
                      disabled={cooldownSeconds > 0}
                    >
                      <Upload className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <p className="text-[7px] md:text-[8px] text-white/30 mt-1">JPG, PNG, GIF up to 5MB</p>
                    {uploadError && (
                      <p className="text-[8px] md:text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                        {uploadError}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Country, State, City - Only for candidates */}
              {selectedRole === 'candidate' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 }}
                    className="w-full"
                  >
                    <label htmlFor="country" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                      <Globe className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                      <span>Country</span> 
                      <span className="text-[#C58B2A]">*</span>
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      placeholder="e.g. Nigeria, United States, UK"
                      className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 ${
                        errors.country ? 'border-red-400 bg-red-500/10' : formData.country ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                      }`}
                      value={formData.country}
                      onChange={handleChange}
                      required={selectedRole === 'candidate'}
                      disabled={cooldownSeconds > 0}
                    />
                    {errors.country && (
                      <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                        {errors.country}
                      </p>
                    )}
                  </motion.div>

                  {/* State Dropdown - Only for Nigeria */}
                  {formData.country?.toLowerCase() === 'nigeria' ? (
                    <SearchableSelect
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      options={states}
                      placeholder="Search for a state..."
                      label="State"
                      required={selectedRole === 'candidate' && formData.country?.toLowerCase() === 'nigeria'}
                      disabled={cooldownSeconds > 0}
                      loading={loadingStates}
                      error={errors.state}
                      icon={MapPin}
                      onBlur={() => {
                        if (errors.state) {
                          setErrors(prev => ({ ...prev, state: '' }));
                        }
                      }}
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 }}
                      className="w-full"
                    >
                      <label htmlFor="state" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                        <span>State/Region</span> 
                        <span className="text-[#C58B2A]">*</span>
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        placeholder="Enter your state or region"
                        className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 ${
                          errors.state ? 'border-red-400 bg-red-500/10' : formData.state ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                        }`}
                        value={formData.state}
                        onChange={handleChange}
                        required={selectedRole === 'candidate'}
                        disabled={cooldownSeconds > 0}
                      />
                      {errors.state && (
                        <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                          {errors.state}
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* City Dropdown - Only for Nigeria with state selected */}
                  {formData.country?.toLowerCase() === 'nigeria' && formData.state && (
                    <SearchableSelect
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      options={cities}
                      placeholder="Search for a city/town..."
                      label="City You Currently Stay"
                      required={selectedRole === 'candidate' && formData.country?.toLowerCase() === 'nigeria'}
                      disabled={cooldownSeconds > 0}
                      loading={loadingCities}
                      error={errors.city}
                      icon={MapPin}
                      onBlur={() => {
                        if (errors.city) {
                          setErrors(prev => ({ ...prev, city: '' }));
                        }
                      }}
                    />
                  )}

                  {/* Manual City Input - For non-Nigeria countries */}
                  {formData.country?.toLowerCase() !== 'nigeria' && (
                    <motion.div
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.65 }}
                      className="w-full"
                    >
                      <label htmlFor="city" className="flex items-center gap-1 text-[10px] md:text-xs font-medium text-white/60 mb-0.5 ml-1">
                        <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                        <span>City You Currently Stay</span>
                        <span className="text-[#C58B2A]">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        placeholder="Enter the city you currently stay in"
                        className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none placeholder:text-white/30 ${
                          errors.city ? 'border-red-400 bg-red-500/10' : formData.city ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                        }`}
                        value={formData.city}
                        onChange={handleChange}
                        required={selectedRole === 'candidate'}
                        disabled={cooldownSeconds > 0}
                      />
                      {errors.city && (
                        <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                          {errors.city}
                        </p>
                      )}
                    </motion.div>
                  )}
                </>
              )}

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full"
              >
                <label htmlFor="password" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                  <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                  <span>Password</span> 
                  <span className="text-[#C58B2A]">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Create password"
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none pr-8 ${
                      errors.password ? 'border-red-400 bg-red-500/10' : formData.password ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                    }`}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    required
                    disabled={cooldownSeconds > 0}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 flex items-center text-white/40 hover:text-white/80 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    disabled={cooldownSeconds > 0}
                  >
                    {showPassword ? <EyeOff size={14} className="flex-shrink-0" /> : <Eye size={14} className="flex-shrink-0" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    {errors.password}
                  </p>
                )}

                <AnimatePresence>
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1 space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                            className={`h-full ${getStrengthColor()}`}
                          />
                        </div>
                        <span className="text-[8px] md:text-[9px] font-medium text-white/60 flex-shrink-0">
                          {getStrengthText()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-0.5 text-[7px] md:text-[8px]">
                        <div className="flex items-center gap-1">
                          {passwordStrength.minLength ? (
                            <Check className="w-2 h-2 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className="text-white/40">8+ chars</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasLower ? (
                            <Check className="w-2 h-2 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className="text-white/40">Lowercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasUpper ? (
                            <Check className="w-2 h-2 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className="text-white/40">Uppercase</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {passwordStrength.hasNumber ? (
                            <Check className="w-2 h-2 text-green-400 flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className="text-white/40">Number</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75 }}
                className="w-full"
              >
                <label htmlFor="confirmPassword" className="flex items-center gap-1 text-xs md:text-sm font-medium text-white/70 mb-1 ml-1">
                  <Lock className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" /> 
                  <span>Confirm Password</span> 
                  <span className="text-[#C58B2A]">*</span>
                </label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    className={`w-full px-3 py-2 md:px-4 md:py-2.5 bg-white/5 border rounded-lg md:rounded-xl text-sm md:text-base text-white focus:ring-1 focus:ring-[#C58B2A] focus:border-[#C58B2A] transition-all outline-none pr-8 ${
                      errors.confirmPassword ? 'border-red-400 bg-red-500/10' : formData.confirmPassword ? 'border-green-400 bg-green-500/10' : 'border-white/20'
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={cooldownSeconds > 0}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 flex items-center text-white/40 hover:text-white/80 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    disabled={cooldownSeconds > 0}
                  >
                    {showConfirmPassword ? <EyeOff size={14} className="flex-shrink-0" /> : <Eye size={14} className="flex-shrink-0" />}
                  </button>
                </div>

                <AnimatePresence>
                  {formData.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -2 }}
                      className="mt-0.5"
                    >
                      {formData.password === formData.confirmPassword ? (
                        <p className="text-[8px] md:text-[9px] text-[#C58B2A] flex items-center gap-1">
                          <Check className="w-2 h-2 flex-shrink-0" /> Passwords match
                        </p>
                      ) : (
                        <p className="text-[8px] md:text-[9px] text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-2 h-2 flex-shrink-0" /> Passwords do not match
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {errors.confirmPassword && (
                  <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    {errors.confirmPassword}
                  </p>
                )}
              </motion.div>

              {/* Terms Acceptance */}
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white/5 rounded-lg p-2 border border-white/10 w-full"
              >
                <label htmlFor="terms" className="flex items-start gap-1.5 cursor-pointer group">
                  <div className="relative flex items-center justify-center flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      id="terms"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="w-3 h-3 opacity-0 absolute cursor-pointer"
                      disabled={cooldownSeconds > 0}
                    />
                    <div className={`w-3 h-3 border rounded flex items-center justify-center transition-all flex-shrink-0 ${
                      formData.agreeTerms 
                        ? 'bg-green-400 border-green-400'
                        : 'border-white/30 group-hover:border-[#C58B2A]'
                    }`}>
                      {formData.agreeTerms && <Check className="w-2 h-2 text-black flex-shrink-0" />}
                    </div>
                  </div>
                  <span className="text-[9px] md:text-[10px] text-white/60 leading-tight">
                    I agree to the{' '}
                    <Link 
                      href="/terms" 
                      className="text-[#C58B2A] font-semibold hover:text-green-400 hover:underline transition-colors"
                      target="_blank"
                    >
                      Terms
                    </Link>{' '}
                    &{' '}
                    <Link 
                      href="/privacy" 
                      className="text-[#C58B2A] font-semibold hover:text-green-400 hover:underline transition-colors"
                      target="_blank"
                    >
                      Privacy
                    </Link>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <p className="mt-0.5 text-[8px] md:text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    {errors.agreeTerms}
                  </p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !formData.agreeTerms || cooldownSeconds > 0 || (selectedRole === 'candidate' && usernameAvailable !== true)}
                whileHover={{ scale: (loading || !formData.agreeTerms || cooldownSeconds > 0 || (selectedRole === 'candidate' && usernameAvailable !== true)) ? 1 : 1.01 }}
                whileTap={{ scale: (loading || !formData.agreeTerms || cooldownSeconds > 0 || (selectedRole === 'candidate' && usernameAvailable !== true)) ? 1 : 0.99 }}
                className={`w-full py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold text-black shadow-md transition-all relative overflow-hidden group ${
                  loading || !formData.agreeTerms || cooldownSeconds > 0 || (selectedRole === 'candidate' && usernameAvailable !== true)
                    ? 'bg-white/10 cursor-not-allowed text-white/40'
                    : 'bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 hover:text-white'
                }`}
              >
                {!cooldownSeconds && (selectedRole !== 'candidate' || usernameAvailable === true) && !loading && formData.agreeTerms && (
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 0.8,
                    }}
                  />
                )}
                
                {loading ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border-2 border-black border-t-transparent rounded-full flex-shrink-0"
                    />
                    <span className="text-xs md:text-sm">Creating...</span>
                  </div>
                ) : cooldownSeconds > 0 ? (
                  <span className="text-xs md:text-sm relative z-10">
                    Wait {cooldownSeconds}s
                  </span>
                ) : selectedRole === 'candidate' && usernameAvailable !== true ? (
                  <span className="text-xs md:text-sm relative z-10 flex items-center justify-center gap-1.5">
                    <X className="w-3 h-3 flex-shrink-0" />
                    Choose Available Username
                  </span>
                ) : (
                  <span className="text-xs md:text-sm relative z-10 flex items-center justify-center gap-1.5">
                    <Star className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                    Submit
                    <Star className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  </span>
                )}
              </motion.button>

              {/* Login Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85 }}
                className="text-center"
              >
                <p className="text-[9px] md:text-[10px] text-white/40">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-[#C58B2A] font-semibold hover:text-green-400 hover:underline transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>

              {/* Security Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center justify-center gap-1"
              >
                <Shield className="w-2.5 h-2.5 text-white/20 flex-shrink-0" />
                <span className="text-[6px] md:text-[7px] text-white/20">Secure • Encrypted</span>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>

      {/* Whatsapp number warning */}
      <AnimatePresence>
        {showWhatsappNotice && selectedRole === 'candidate' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={dismissWhatsappNotice}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.25, ease: 'easeOut' } }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="whatsapp-warning-title"
              className="relative w-full max-w-sm rounded-2xl border border-[#C58B2A]/40 bg-gray-900 p-5 shadow-2xl shadow-black/50"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close Whatsapp warning"
                onClick={dismissWhatsappNotice}
                className="absolute right-3 top-3 text-white/50 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 pr-5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#C58B2A]/15">
                  <AlertTriangle className="h-5 w-5 text-[#C58B2A]" />
                </div>
                <div>
                  <h2 id="whatsapp-warning-title" className="text-base font-semibold text-white">
                    Active Whatsapp Number Required
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                    This must be an active Whatsapp number. Otherwise, you will be disqualified.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissWhatsappNotice}
                className="mt-4 w-full rounded-lg bg-[#C58B2A] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#A96F1F]"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fan Disabled Modal */}
      <AnimatePresence>
        {showFanDisabledModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-[#C58B2A]/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-[#C58B2A]/10 text-center"
            >
              <div className="mb-6">
                <div className="w-20 h-20 bg-[#C58B2A]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-[#C58B2A]" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Fan Portal Coming Soon! 🎉
                </h2>
                <p className="text-white/70 text-sm leading-relaxed">
                  The fan registration will be open as soon as the candidate registration period is over. 
                  We appreciate your patience and enthusiasm!
                </p>
              </div>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFanModalAction('contest')}
                  className="w-full p-3 rounded-xl bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 hover:text-white text-black font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-green-500/30"
                >
                  <Crown className="w-4 h-4 flex-shrink-0" />
                  Register as Contestant
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleFanModalAction('home')}
                  className="w-full p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-4 h-4 flex-shrink-0" />
                  Go to Homepage
                </motion.button>
              </div>

              <p className="text-white/30 text-xs mt-4">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-[#C58B2A] hover:text-green-400 transition-colors hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Guidance Modal */}
      <AnimatePresence>
        {showAvatarGuidance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAvatarGuidance(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-[#C58B2A]/30 rounded-2xl p-5 md:p-6 max-w-sm max-h-[90vh] w-full overflow-y-auto shadow-2xl shadow-[#C58B2A]/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-1.5">
                  Profile Picture Tips
                </h3>
                <p className="text-white/60 text-xs">
                  Make a great first impression! Here are some examples of good profile pictures.
                </p>
              </div>

              {/* Example Images Carousel */}
              <div className="relative mb-4">
                <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-[#C58B2A]/30 shadow-lg shadow-[#C58B2A]/20">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentExampleIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="relative w-full h-full"
                    >
                      <Image
                        src={exampleImages[currentExampleIndex]}
                        alt={`Example profile picture ${currentExampleIndex + 1}`}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-[10px] text-white/80">
                      {currentExampleIndex + 1} / {exampleImages.length}
                    </span>
                  </div>
                </div>

                {/* Navigation dots */}
                <div className="flex justify-center gap-2 mt-3">
                  {exampleImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentExampleIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentExampleIndex
                          ? 'bg-[#C58B2A] w-4'
                          : 'bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-start gap-2 text-xs text-white/70">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Use a clear, well-lit photo</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-white/70">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Face should be clearly visible</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-white/70">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Professional or friendly appearance</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-white/70">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>Avoid blurry or low-quality images</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer w-full">
                  <div className="w-full py-2.5 px-4 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] hover:from-green-500 hover:to-emerald-500 text-black font-semibold rounded-xl text-center transition-all hover:shadow-lg hover:shadow-[#C58B2A]/30">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUploadFromGuidance}
                      className="hidden"
                    />
                    <span className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4 flex-shrink-0" />
                      Upload My Photo
                    </span>
                  </div>
                </label>
                
                <button
                  onClick={() => setShowAvatarGuidance(false)}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm transition-all"
                >
                  Skip for now
                </button>
              </div>

              <p className="text-[8px] text-white/30 text-center mt-4">
                You can always update your profile picture later
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-[#C58B2A]/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-[#C58B2A]/10 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-[#C58B2A] to-[#A96F1F] rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-black" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">
                Welcome to WhoWin! 🎉
              </h2>
              
              <p className="text-[#C58B2A] text-base mb-6">
                {selectedRole === 'candidate' 
                  ? 'Your contestant profile has been created successfully!' 
                  : 'Your fan account has been created successfully!'}
              </p>
              
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3 text-sm text-white/80">
                  <p>You're now signed in as <span className="font-bold text-[#C58B2A]">@{formData.username || formData.fullName}</span></p>
                  <p className="text-xs text-white/40 mt-1">
                    {selectedRole === 'candidate' ? 'Contestant' : 'Fan'} • {formData.email}
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 text-sm text-[#C58B2A]/80">
                  <div className="w-2 h-2 bg-[#C58B2A] rounded-full animate-pulse flex-shrink-0"></div>
                  <span>Taking you to your dashboard...</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(250, 204, 21, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(250, 204, 21, 0.6);
        }
      `}</style>
    </section>
  );
}