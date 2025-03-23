import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const ContactInfo: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="mt-4 text-center">
      <p className="text-gray-500 text-sm">
        {t('contact.email')}: <a href="mailto:13335930102wzs@gmail.com" className="text-crimson-600 hover:underline">13335930102wzs@gmail.com</a>
      </p>
      <p className="text-gray-500 text-sm mt-1">
        {t('contact.message')}
      </p>
    </div>
  );
};

export default ContactInfo; 