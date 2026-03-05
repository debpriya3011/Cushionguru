'use client';

import { useState, useEffect } from 'react';

interface CustomerFormProps {
  onChange?: (data: CustomerData) => void;
  initialData?: Partial<CustomerData>;
}

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
  };
}

const INITIAL_DATA: CustomerData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
  },
};

export function CustomerForm({ onChange, initialData }: CustomerFormProps) {
  const [data, setData] = useState<CustomerData>({ ...INITIAL_DATA, ...initialData });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData | string, string>>>({});

  useEffect(() => {
    onChange?.(data);
  }, [data, onChange]);

  const validate = (field: string, value: string): boolean => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return value.trim().length >= 2;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return value === '' || /^[\d\s\-\(\)\+]{10,}$/.test(value);
      case 'address.line1':
        return value.trim().length >= 5;
      case 'address.city':
        return value.trim().length >= 2;
      case 'address.state':
        return value.trim().length >= 2;
      case 'address.zip':
        return /^\d{5}(-\d{4})?$/.test(value);
      default:
        return true;
    }
  };

  const handleChange = (field: keyof CustomerData | string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setData(prev => ({ ...prev, [field]: value }));
    }

    // Validate field
    const isValid = validate(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: isValid ? undefined : getErrorMessage(field),
    }));
  };

  const getErrorMessage = (field: string): string => {
    const messages: Record<string, string> = {
      firstName: 'First name is required (min 2 characters)',
      lastName: 'Last name is required (min 2 characters)',
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      'address.line1': 'Address line 1 is required',
      'address.city': 'City is required',
      'address.state': 'State is required',
      'address.zip': 'Please enter a valid ZIP code',
    };
    return messages[field] || 'Invalid value';
  };

  return (
    <div className="space-y-6">
      {/* Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Contact Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="john.doe@example.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="(555) 123-4567"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 1 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.address.line1}
            onChange={(e) => handleChange('address.line1', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors['address.line1'] ? 'border-red-500' : 'border-gray-300'
              }`}
            placeholder="123 Main Street"
          />
          {errors['address.line1'] && (
            <p className="text-red-500 text-xs mt-1">{errors['address.line1']}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2
          </label>
          <input
            type="text"
            value={data.address.line2}
            onChange={(e) => handleChange('address.line2', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="Apt 4B"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.address.city}
              onChange={(e) => handleChange('address.city', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="New York"
            />
            {errors['address.city'] && (
              <p className="text-red-500 text-xs mt-1">{errors['address.city']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.address.state}
              onChange={(e) => handleChange('address.state', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors['address.state'] ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="NY"
            />
            {errors['address.state'] && (
              <p className="text-red-500 text-xs mt-1">{errors['address.state']}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.address.zip}
              onChange={(e) => handleChange('address.zip', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${errors['address.zip'] ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="10001"
            />
            {errors['address.zip'] && (
              <p className="text-red-500 text-xs mt-1">{errors['address.zip']}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
