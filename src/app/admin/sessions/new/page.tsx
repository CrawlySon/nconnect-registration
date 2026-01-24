'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Stage } from '@/types';

export default function NewSessionPage() {
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    speaker_name: '',
    speaker_company: '',
    description: '',
    stage_id: '',
    date: '2026-03-26',
    start_time: '09:00',
    end_time: '09:45',
    capacity: '60',
  });

  useEffect(() => {
    // Check if authenticated
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth !== 'true') {
      router.push('/admin');
      return;
    }
    loadStages();
  }, [router]);

  const loadStages = async () => {
    try {
      const response = await fetch('/api/admin/sessions');
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);
      
      setStages(data.stages);
      if (data.stages.length > 0) {
        setFormData(prev => ({ ...prev, stage_id: data.stages[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo sa načítať dáta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      router.push('/admin/sessions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uloženie zlyhalo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-nconnect-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin/sessions" 
          className="p-2 hover:bg-nconnect-surface rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-nconnect-muted" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-white">
            Nová prednáška
          </h1>
          <p className="text-nconnect-muted mt-1">
            Pridaj novú prednášku do programu
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-nconnect-surface border border-nconnect-secondary/30 rounded-xl p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Názov prednášky *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="napr. MLOps - cesta AI do produkcie"
              className="input-field"
            />
          </div>

          {/* Speaker info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="speaker_name" className="block text-sm font-medium text-white mb-2">
                Meno speakera *
              </label>
              <input
                type="text"
                id="speaker_name"
                name="speaker_name"
                value={formData.speaker_name}
                onChange={handleChange}
                required
                placeholder="napr. Jakub Novotný"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="speaker_company" className="block text-sm font-medium text-white mb-2">
                Firma
              </label>
              <input
                type="text"
                id="speaker_company"
                name="speaker_company"
                value={formData.speaker_company}
                onChange={handleChange}
                placeholder="napr. Slovak Telekom"
                className="input-field"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Popis
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Krátky popis prednášky..."
              className="input-field resize-none"
            />
          </div>

          {/* Stage */}
          <div>
            <label htmlFor="stage_id" className="block text-sm font-medium text-white mb-2">
              Stage *
            </label>
            <select
              id="stage_id"
              name="stage_id"
              value={formData.stage_id}
              onChange={handleChange}
              required
              className="input-field"
            >
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and time */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-white mb-2">
                Dátum *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-white mb-2">
                Začiatok *
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-white mb-2">
                Koniec *
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-white mb-2">
              Kapacita *
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              max="500"
              className="input-field w-32"
            />
            <p className="text-nconnect-muted text-sm mt-1">
              Maximálny počet účastníkov na prednášku
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ukladám...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Uložiť prednášku
              </>
            )}
          </button>
          
          <Link
            href="/admin/sessions"
            className="btn-secondary"
          >
            Zrušiť
          </Link>
        </div>
      </form>
    </div>
  );
}
