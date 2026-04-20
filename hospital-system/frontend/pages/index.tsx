import React, { useState, useEffect } from 'react'
import styles from '@/styles/Home.module.css'

export default function Home() {
  const [status, setStatus] = useState('Loading...')
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [incidents, setIncidents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'equipment',
    severity: 'high',
    description: '',
    unit: '',
  })

  useEffect(() => {
    checkBackend()
    loadIncidents()
  }, [])

  const checkBackend = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOSPITAL_API}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        setBackendStatus('✅ Connected')
      } else {
        setBackendStatus('❌ Disconnected')
      }
    } catch {
      setBackendStatus('❌ Disconnected')
    }
    setStatus('Ready')
  }

  const loadIncidents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOSPITAL_API}/incidents`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        setIncidents(data)
      }
    } catch (err) {
      console.error('Failed to load incidents:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_HOSPITAL_API}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const newIncident = await res.json()
        setIncidents([newIncident, ...incidents])
        setFormData({
          title: '',
          type: 'equipment',
          severity: 'high',
          description: '',
          unit: '',
        })
        setShowForm(false)
        alert('✅ Incident reported successfully and tracked via Helix SDK')
      } else {
        alert('❌ Failed to create incident')
      }
    } catch (err) {
      alert('❌ Error: ' + err)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>🏥 Hospital Management System</h1>
        
        <div className={styles.card}>
          <h2>Frontend Status</h2>
          <p>Status: {status}</p>
        </div>

        <div className={styles.card}>
          <h2>Backend Connection</h2>
          <p>{backendStatus}</p>
          <p className={styles.small}>API: {process.env.NEXT_PUBLIC_HOSPITAL_API}</p>
        </div>

        <div className={styles.card}>
          <h2>System Information</h2>
          <p>Frontend Port: 3001</p>
          <p>Backend Port: 5001</p>
          <p>Helix Integration: ✅ Active</p>
        </div>

        <div className={styles.card}>
          <h2>Incident Management</h2>
          <button
            className={styles.button}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✖ Cancel' : '➕ Report New Incident'}
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="text"
                name="title"
                placeholder="Incident Title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className={styles.input}
              />

              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={styles.input}
              >
                <option value="equipment">Equipment Issue</option>
                <option value="patient">Patient Alert</option>
                <option value="system">System Alert</option>
                <option value="other">Other</option>
              </select>

              <select
                name="severity"
                value={formData.severity}
                onChange={handleInputChange}
                className={styles.input}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <input
                type="text"
                name="unit"
                placeholder="Unit/Location (e.g., ICU-3)"
                value={formData.unit}
                onChange={handleInputChange}
                className={styles.input}
              />

              <textarea
                name="description"
                placeholder="Incident Description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className={styles.textarea}
              />

              <button type="submit" className={styles.button}>
                📤 Submit Incident
              </button>
            </form>
          )}

          {incidents.length > 0 && (
            <div className={styles.incidentsList}>
              <h3>Recent Incidents ({incidents.length})</h3>
              {incidents.slice(0, 5).map((incident: any) => (
                <div key={incident.id} className={styles.incidentItem}>
                  <strong>{incident.title}</strong>
                  <p>
                    Type: {incident.type} | Severity:{' '}
                    <span
                      style={{
                        color:
                          incident.severity === 'critical'
                            ? 'red'
                            : incident.severity === 'high'
                            ? 'orange'
                            : 'green',
                      }}
                    >
                      {incident.severity}
                    </span>
                  </p>
                  <p>{incident.description}</p>
                  <small>
                    {new Date(incident.timestamp).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.features}>
          <h2>Available Features</h2>
          <ul>
            <li>✅ Patient Monitoring</li>
            <li>✅ Equipment Status</li>
            <li>✅ Crisis Detection</li>
            <li>✅ Real-time Alerts</li>
            <li>✅ Multi-Tenancy Support</li>
            <li>✅ Incident Reporting</li>
          </ul>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Helix SDK Integration Ready</p>
      </footer>
    </div>
  )
}
