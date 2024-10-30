// React 18.2.0
import React from 'react';
import { Button } from '../common/Button';
import useAuth from '../../hooks/useAuth';

/**
 * Footer component that provides consistent footer content, navigation links,
 * and copyright information across the application.
 * 
 * @implements Frontend Layer requirement for consistent footer presence
 * @implements User Interface Design requirement for cohesive user experience
 */
const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();

  // Define navigation links based on authentication state
  const navigationLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    ...(isAuthenticated
      ? [
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Documents', href: '/documents' },
          { label: 'Settings', href: '/settings' },
        ]
      : [
          { label: 'Features', href: '/features' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Contact', href: '/contact' },
        ]),
  ];

  // Define company information
  const companyInfo = {
    name: 'DocuFlow',
    address: '123 Tech Street, Silicon Valley, CA 94025',
    email: 'support@docuflow.com',
    phone: '+1 (555) 123-4567',
  };

  // Define social media links
  const socialLinks = [
    { label: 'LinkedIn', href: 'https://linkedin.com/company/docuflow' },
    { label: 'Twitter', href: 'https://twitter.com/docuflow' },
    { label: 'GitHub', href: 'https://github.com/docuflow' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">About Us</h3>
            <div className="space-y-2">
              <p className="text-sm">{companyInfo.name}</p>
              <p className="text-sm">{companyInfo.address}</p>
              <p className="text-sm">{companyInfo.email}</p>
              <p className="text-sm">{companyInfo.phone}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Quick Links</h3>
            <div className="flex flex-col space-y-2">
              {navigationLinks.map((link) => (
                <Button
                  key={link.label}
                  label={link.label}
                  variant="outline"
                  size="small"
                  onClick={() => window.location.href = link.href}
                  className="justify-start px-0 hover:text-white"
                />
              ))}
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Connect With Us</h3>
            <div className="flex flex-col space-y-2">
              {socialLinks.map((link) => (
                <Button
                  key={link.label}
                  label={link.label}
                  variant="outline"
                  size="small"
                  onClick={() => window.open(link.href, '_blank')}
                  className="justify-start px-0 hover:text-white"
                />
              ))}
            </div>
          </div>

          {/* Newsletter Subscription */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold">Stay Updated</h3>
            <p className="text-sm">Subscribe to our newsletter for updates and news.</p>
            <div className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                label="Subscribe"
                variant="primary"
                size="small"
                onClick={() => {/* Handle subscription */}}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright Notice */}
            <div className="text-sm">
              © {currentYear} {companyInfo.name}. All rights reserved.
            </div>

            {/* Legal Links */}
            <div className="flex space-x-6">
              <Button
                label="Privacy Policy"
                variant="outline"
                size="small"
                onClick={() => window.location.href = '/privacy'}
                className="text-sm hover:text-white"
              />
              <Button
                label="Terms of Service"
                variant="outline"
                size="small"
                onClick={() => window.location.href = '/terms'}
                className="text-sm hover:text-white"
              />
              <Button
                label="Cookie Policy"
                variant="outline"
                size="small"
                onClick={() => window.location.href = '/cookies'}
                className="text-sm hover:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;