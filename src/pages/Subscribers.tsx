import React, { useEffect, useState, useRef } from 'react';
import {  UserPlus, Trash2, Mail, UserMinus, Download, Upload, X, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { sendCampaign } from '../lib/mailbuster';

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  subscribed: boolean;
  created_at: string;
}

interface ImportModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

function ImportModal({ onClose, onImportComplete }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.split(',').map(cell => cell.trim()));
        setPreview(lines.slice(0, 5)); // Show first 5 lines as preview
      };
      reader.readAsText(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split('\n')
        .map(line => line.split(',').map(cell => cell.trim()))
        .filter(line => line.length >= 2 && line[0] && line[1]); // Ensure email and name exist

      const [header, ...data] = lines;
      const emailIndex = header.findIndex(col => col.toLowerCase().includes('email'));
      const nameIndex = header.findIndex(col => col.toLowerCase().includes('name'));

      if (emailIndex === -1) {
        throw new Error('CSV must contain an email column');
      }

      const subscribers = data.map(line => ({
        email: line[emailIndex],
        first_name: nameIndex !== -1 ? line[nameIndex] : null,
        subscribed: true
      }));

      const { error: importError } = await supabase
        .from('subscribers')
        .insert(subscribers);

      if (importError) throw importError;

      onImportComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import subscribers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Import Subscribers</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Upload a file</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV file with email and name columns</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {preview.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        {preview[0].map((header, i) => (
                          <th
                            key={i}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.slice(1).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-sm text-gray-500">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Subscribers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SendEmailModal({ isOpen, onClose, selectedEmails }: { 
  isOpen: boolean; 
  onClose: () => void;
  selectedEmails: string[];
}) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const result = await sendCampaign({
        name: subject,
        subject,
        content: `<div style="font-family: Arial, sans-serif;">${content}</div>`,
        recipientList: selectedEmails
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to send email');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Send Email</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Recipients
            </label>
            <div className="mt-1 p-2 bg-gray-50 rounded-md">
              {selectedEmails.join(', ')}
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function Subscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ email: '', first_name: '' });
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addSubscriber(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .insert([{
          email: newSubscriber.email,
          first_name: newSubscriber.first_name || null,
        }])
        .select();

      if (error) throw error;
      if (data) {
        setSubscribers([data[0], ...subscribers]);
        setNewSubscriber({ email: '', first_name: '' });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding subscriber:', error);
    }
  }

  async function toggleSubscriptionStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('subscribers')
        .update({ subscribed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setSubscribers(subscribers.map(sub =>
        sub.id === id ? { ...sub, subscribed: !currentStatus } : sub
      ));
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  }

  async function deleteSubscriber(id: string) {
    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSubscribers(subscribers.filter(sub => sub.id !== id));
    } catch (error) {
      console.error('Error deleting subscriber:', error);
    }
  }

  const exportSubscribers = () => {
    // Create CSV content
    const headers = ['Email', 'First Name', 'Subscribed', 'Joined'];
    const csvContent = subscribers.map(sub => [
      sub.email,
      sub.first_name || '',
      sub.subscribed ? 'Yes' : 'No',
      format(new Date(sub.created_at), 'yyyy-MM-dd')
    ]);

    // Combine headers and data
    const csvString = [
      headers.join(','),
      ...csvContent.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendMailButton = (
    <button
      onClick={() => setShowSendModal(true)}
      disabled={selectedSubscribers.length === 0}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
    >
      <Send className="w-4 h-4 mr-2" />
      Send Email
    </button>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Subscribers</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all subscribers in your mailing list
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={() => setShowSendModal(true)}
            disabled={selectedSubscribers.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Subscriber
          </button>
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            type="button"
            onClick={exportSubscribers}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mt-8 max-w-xl">
          <form onSubmit={addSubscriber} className="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={newSubscriber.first_name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, first_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Subscriber
              </button>
            </div>
          </form>
        </div>
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={fetchSubscribers}
        />
      )}

      {showSendModal && (
        <SendEmailModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          selectedEmails={selectedSubscribers}
        />
      )}

      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle">
            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading subscribers...</div>
              ) : subscribers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No subscribers found. Add your first subscriber!</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubscribers(subscribers.map(sub => sub.email));
                            } else {
                              setSelectedSubscribers([]);
                            }
                          }}
                          checked={selectedSubscribers.length === subscribers.length}
                        />
                      </th>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Email</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Joined</th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {subscribers.map((subscriber) => (
                      <tr key={subscriber.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedSubscribers.includes(subscriber.email)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubscribers([...selectedSubscribers, subscriber.email]);
                              } else {
                                setSelectedSubscribers(selectedSubscribers.filter(email => email !== subscriber.email));
                              }
                            }}
                          />
                        </td>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {subscriber.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {subscriber.first_name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            subscriber.subscribed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subscriber.subscribed ? 'Subscribed' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleSubscriptionStatus(subscriber.id, subscriber.subscribed)}
                              className={`${
                                subscriber.subscribed
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={subscriber.subscribed ? 'Unsubscribe' : 'Subscribe'}
                            >
                              {subscriber.subscribed ? (
                                <UserMinus className="h-4 w-4" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSubscriber(subscriber.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Subscriber"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscribers;