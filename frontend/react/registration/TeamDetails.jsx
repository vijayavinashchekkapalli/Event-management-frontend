import React from 'react';

const yearOptions = [
  { value: '', label: 'Select year' },
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' }
];

export default function TeamDetails({ data, errors, onChange, onNext, canNext }) {
  const memberCount = Number(data.teamSize || 0) > 1 ? Number(data.teamSize) - 1 : 0;

  return (
    <div className="step-panel">
      <div className="step-panel__header">
        <p className="step-kicker">Step 1 of 4</p>
        <h2>Team Details</h2>
        <p>Enter your team information before continuing.</p>
      </div>

      <div className="grid-two">
        <label className="field">
          <span>Team Name</span>
          <input
            type="text"
            value={data.teamName}
            onChange={(event) => onChange('teamName', event.target.value)}
            placeholder="Enter team name"
            autoComplete="off"
          />
          {errors.teamName && <small className="field-error">{errors.teamName}</small>}
        </label>

        <label className="field">
          <span>Team Leader Name</span>
          <input
            type="text"
            value={data.teamLeaderName}
            onChange={(event) => onChange('teamLeaderName', event.target.value)}
            placeholder="Leader name"
            autoComplete="off"
          />
          {errors.teamLeaderName && <small className="field-error">{errors.teamLeaderName}</small>}
        </label>

        <label className="field">
          <span>Team Leader Email</span>
          <input
            type="email"
            value={data.email}
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="leader@example.com"
            autoComplete="email"
          />
          {errors.email && <small className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Year</span>
          <select value={data.year} onChange={(event) => onChange('year', event.target.value)}>
            {yearOptions.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.year && <small className="field-error">{errors.year}</small>}
        </label>

        <label className="field">
          <span>Stream</span>
          <input
            type="text"
            value={data.stream}
            onChange={(event) => onChange('stream', event.target.value)}
            placeholder="e.g. CSE, ECE, ME"
            autoComplete="off"
          />
          {errors.stream && <small className="field-error">{errors.stream}</small>}
        </label>

        <label className="field">
          <span>Contact Number</span>
          <input
            type="tel"
            value={data.contactNumber}
            onChange={(event) => onChange('contactNumber', event.target.value)}
            placeholder="10 digit contact number"
            autoComplete="off"
          />
          {errors.contactNumber && <small className="field-error">{errors.contactNumber}</small>}
        </label>

        <label className="field">
          <span>Team Size</span>
          <select value={data.teamSize} onChange={(event) => onChange('teamSize', event.target.value)}>
            <option value="">Select team size</option>
            <option value="2">2 members</option>
            <option value="3">3 members</option>
            <option value="4">4 members</option>
            <option value="5">5 members</option>
          </select>
          {errors.teamSize && <small className="field-error">{errors.teamSize}</small>}
        </label>
      </div>

      <div className="members-block">
        <div className="members-block__header">
          <h3>Team Members</h3>
          <p>{memberCount > 0 ? `Add ${memberCount} member${memberCount === 1 ? '' : 's'}` : 'Select a team size to add members.'}</p>
        </div>

        <div className="members-list">
          {Array.from({ length: memberCount }).map((_, index) => {
            const member = data.teamMembers[index] || { name: '', phone: '', stream: '', year: '' };
            return (
              <div className="member-row" key={index} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px'}}>
                <label className="field">
                  <span>Member {index + 1} Name</span>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(event) => onChange('teamMembers', { ...member, name: event.target.value }, index)}
                    placeholder={`Enter member ${index + 1} name`}
                    autoComplete="off"
                  />
                  {errors.teamMembers?.[index]?.name && <small className="field-error">{errors.teamMembers[index].name}</small>}
                </label>

                <label className="field">
                  <span>Phone</span>
                  <input
                    type="tel"
                    value={member.phone}
                    onChange={(event) => onChange('teamMembers', { ...member, phone: event.target.value }, index)}
                    placeholder="10 digit phone"
                    autoComplete="off"
                  />
                  {errors.teamMembers?.[index]?.phone && <small className="field-error">{errors.teamMembers[index].phone}</small>}
                </label>

                <label className="field">
                  <span>Stream</span>
                  <input
                    type="text"
                    value={member.stream}
                    onChange={(event) => onChange('teamMembers', { ...member, stream: event.target.value }, index)}
                    placeholder="e.g. CSE, ECE"
                    autoComplete="off"
                  />
                  {errors.teamMembers?.[index]?.stream && <small className="field-error">{errors.teamMembers[index].stream}</small>}
                </label>

                <label className="field">
                  <span>Year</span>
                  <select value={member.year} onChange={(event) => onChange('teamMembers', { ...member, year: event.target.value }, index)}>
                    {yearOptions.map((option) => (
                      <option key={option.value || 'empty'} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.teamMembers?.[index]?.year && <small className="field-error">{errors.teamMembers[index].year}</small>}
                </label>

              </div>
            );
          })}
        </div>
      </div>

      <div className="step-actions">
        <button className="btn-primary" type="button" onClick={onNext} disabled={!canNext}>
          Submit
        </button>
      </div>
    </div>
  );
}
