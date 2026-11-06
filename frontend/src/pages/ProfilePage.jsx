import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { errorText } from '../lib/format';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!avatar) return setPreview('');
    const url = URL.createObjectURL(avatar);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  const chooseAvatar = (event) => {
    const file = event.target.files[0] ?? null;
    setError('');
    if (file && !AVATAR_TYPES.includes(file.type)) {
      event.target.value = '';
      return setError('Profile image must be a JPG, PNG or WEBP file.');
    }
    if (file && file.size > MAX_AVATAR_BYTES) {
      event.target.value = '';
      return setError('Profile image must be 2 MB or smaller.');
    }
    setAvatar(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!email.trim()) return setError('Please enter your email address.');

    const body = new FormData();
    body.append('name', name.trim());
    body.append('email', email.trim());
    if (avatar) body.append('avatar', avatar);

    setSaving(true);
    try {
      const { data } = await client.patch('/auth/profile', body);
      setUser(data.user);
      setAvatar(null);
      event.target.reset();
      setNotice('Profile saved.');
    } catch (err) {
      setError(errorText(err, 'Could not save your profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const shownImage = preview || user.avatar?.url;

  return (
    <section className="profile-page">
      <p className="eyebrow">Your account</p>
      <h1>Profile</h1>
      <p className="lead">Keep your details current to get the most from CareerNest.</p>

      <div className="panel profile-card">
        <h2>Personal details</h2>
        <form onSubmit={submit} noValidate>
          <label>
            Name
            <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Profile image <span className="hint">optional · max 2 MB</span>
            {shownImage && <img className="avatar-preview" src={shownImage} alt="Your profile" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} />
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p className="success" role="status">{notice}</p>}

          <button className="button publish" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </section>
  );
}
