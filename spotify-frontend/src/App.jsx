import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  LogOut,
  UserRound,
  Music2,
  Upload,
  Disc3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authApi, musicApi } from "./api";

const coverGradients = [
  "linear-gradient(135deg,#5038a0,#d84b93)",
  "linear-gradient(135deg,#1db954,#0b5d2b)",
  "linear-gradient(135deg,#e85d04,#9d0208)",
  "linear-gradient(135deg,#4361ee,#4cc9f0)",
  "linear-gradient(135deg,#7209b7,#f72585)",
];

function Cover({ title = "Music", index = 0, small = false }) {
  return (
    <div
      className={`cover ${small ? "cover-small" : ""}`}
      style={{ background: coverGradients[index % coverGradients.length] }}
    >
      <Music2 size={small ? 28 : 48} />
      <span>{title.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("spotify_user")); } catch { return null; }
  });
  const [view, setView] = useState("home");
  const [musics, setMusics] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeMusic, setActiveMusic] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    if (!user || user.role !== "user") return;
    try {
      const [musicRes, albumRes] = await Promise.all([
        musicApi.all(),
        musicApi.albums(),
      ]);
      setMusics(musicRes.musics || []);
      setAlbums(albumRes.albums || []);
    } catch (error) {
      setNotice(error.message);
    }
  };

  useEffect(() => {
    refresh();
  }, [user]);

  const login = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem("spotify_user", JSON.stringify(loggedInUser));
    setView("home");
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem("spotify_user");
    setUser(null);
    setMusics([]);
    setAlbums([]);
    setActiveMusic(null);
  };

  if (!user) return <AuthScreen onLogin={login} />;

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        view={view}
        setView={setView}
        logout={logout}
        setNotice={setNotice}
      />

      <main className="main-area">
        <header className="topbar">
          <div className="nav-buttons">
            <button className="round-btn" onClick={() => window.history.back()}><ChevronLeft /></button>
            <button className="round-btn" onClick={() => window.history.forward()}><ChevronRight /></button>
          </div>
          <div className="topbar-actions">
            <button className="profile-pill"><UserRound size={18} /> {user.username}</button>
          </div>
        </header>

        {notice && (
          <div className="notice">
            {notice}
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {view === "home" && (
          <HomeView
            user={user}
            musics={musics}
            albums={albums}
            onPlay={(m) => { setActiveMusic(m); setPlaying(true); }}
            onAlbum={(a) => { setSelectedAlbum(a); setView("album"); }}
            setView={setView}
          />
        )}

        {view === "search" && (
          <SearchView
            query={query}
            setQuery={setQuery}
            musics={musics}
            albums={albums}
            onPlay={(m) => { setActiveMusic(m); setPlaying(true); }}
            onAlbum={(a) => { setSelectedAlbum(a); setView("album"); }}
          />
        )}

        {view === "library" && (
          <LibraryView
            musics={musics}
            albums={albums}
            onPlay={(m) => { setActiveMusic(m); setPlaying(true); }}
            onAlbum={(a) => { setSelectedAlbum(a); setView("album"); }}
          />
        )}

        {view === "album" && (
          <AlbumView
            album={selectedAlbum}
            onBack={() => setView("home")}
            onPlay={(m) => { setActiveMusic(m); setPlaying(true); }}
          />
        )}

        {view === "artist" && user.role === "artist" && (
          <ArtistDashboard musics={musics} setNotice={setNotice} refresh={refresh} />
        )}

        {view === "profile" && <Profile user={user} logout={logout} />}
      </main>

      <Player
        music={activeMusic}
        playing={playing}
        setPlaying={setPlaying}
      />
    </div>
  );
}

function Sidebar({ user, view, setView, logout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
      <img src="/spotify-logo.png" alt="Spotify" />
       <span>Spotify</span>
      </div>
      <nav className="nav-list">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>
          <Home /> Home
        </button>
        <button className={view === "search" ? "active" : ""} onClick={() => setView("search")}>
          <Search /> Search
        </button>
        <button className={view === "library" ? "active" : ""} onClick={() => setView("library")}>
          <Library /> Your Library
        </button>
      </nav>

      <div className="sidebar-section">
        <p className="sidebar-label">Your Music</p>
        {user.role === "artist" && (
          <button onClick={() => setView("artist")} className={view === "artist" ? "active" : ""}>
            <Upload /> Artist Studio
          </button>
        )}
        <button onClick={() => setView("profile")} className={view === "profile" ? "active" : ""}>
          <UserRound /> Profile
        </button>
      </div>

      <div className="sidebar-bottom">
        <div className="mini-user">
          <div className="avatar">{user.username?.[0]?.toUpperCase()}</div>
          <div>
            <strong>{user.username}</strong>
            <span>{user.role}</span>
          </div>
        </div>
        <button className="logout" onClick={logout}><LogOut /> Logout</button>
      </div>
    </aside>
  );
}

function HomeView({ musics, albums, onPlay, onAlbum, setView }) {
  const popular = musics.slice(0, 6);
  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">YOUR MUSIC</p>
          <h1>Good afternoon</h1>
          <p>Jump back into your music and discover what your artists have uploaded.</p>
          <button className="green-btn" onClick={() => setView("search")}><Search size={18} /> Find something to play</button>
        </div>
        <div className="hero-disc"><Disc3 size={120} /></div>
      </section>

      <SectionTitle title="Popular tracks" />
      {popular.length ? (
        <div className="track-grid">
          {popular.map((m, i) => <TrackCard key={m._id} music={m} index={i} onPlay={onPlay} />)}
        </div>
      ) : <EmptyState text="No music uploaded yet." />}

      <SectionTitle title="Albums" />
      {albums.length ? (
        <div className="card-grid">
          {albums.map((a, i) => <AlbumCard key={a._id} album={a} index={i} onClick={() => onAlbum(a)} />)}
        </div>
      ) : <EmptyState text="No albums available yet." />}
    </div>
  );
}

function SearchView({ query, setQuery, musics, albums, onPlay, onAlbum }) {
  const filteredMusic = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return musics;
    return musics.filter((m) =>
      `${m.title} ${m.artist?.username || ""}`.toLowerCase().includes(q)
    );
  }, [query, musics]);

  const filteredAlbums = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter((a) =>
      `${a.title} ${a.artist?.username || ""}`.toLowerCase().includes(q)
    );
  }, [query, albums]);

  return (
    <div className="page">
      <div className="search-box">
        <Search size={23} />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you want to play?" />
      </div>

      <SectionTitle title={query ? `Results for "${query}"` : "Browse your music"} />
      {filteredMusic.length ? (
        <div className="track-list">
          {filteredMusic.map((m, i) => <TrackRow key={m._id} music={m} index={i} onPlay={onPlay} />)}
        </div>
      ) : <EmptyState text="No matching tracks." />}

      <SectionTitle title="Albums" />
      <div className="card-grid">
        {filteredAlbums.map((a, i) => <AlbumCard key={a._id} album={a} index={i} onClick={() => onAlbum(a)} />)}
      </div>
    </div>
  );
}

function LibraryView({ musics, albums, onPlay, onAlbum }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">COLLECTION</p>
          <h1>Your Library</h1>
        </div>
      </div>
      <div className="library-tabs"><button className="selected">All</button><button>Music</button><button>Albums</button></div>
      <SectionTitle title="Tracks" />
      <div className="track-list">
        {musics.map((m, i) => <TrackRow key={m._id} music={m} index={i} onPlay={onPlay} />)}
      </div>
      <SectionTitle title="Albums" />
      <div className="card-grid">
        {albums.map((a, i) => <AlbumCard key={a._id} album={a} index={i} onClick={() => onAlbum(a)} />)}
      </div>
    </div>
  );
}

function AlbumView({ album, onBack, onPlay }) {
  const [details, setDetails] = useState(album);
  useEffect(() => {
    if (album?._id) musicApi.album(album._id).then((r) => setDetails(r.album)).catch(() => {});
  }, [album]);

  if (!details) return <div className="page"><EmptyState text="Select an album first." /></div>;

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}><ChevronLeft size={18} /> Back</button>
      <section className="album-hero">
        <Cover title={details.title} index={2} />
        <div>
          <p className="eyebrow">ALBUM</p>
          <h1>{details.title}</h1>
          <p>{details.artist?.username || "Unknown artist"} • {details.musics?.length || 0} songs</p>
          <button
            className="play-circle"
            onClick={() => details.musics?.[0] && onPlay(details.musics[0])}
          ><Play fill="currentColor" /></button>
        </div>
      </section>
      <div className="track-list">
        {(details.musics || []).map((m, i) => <TrackRow key={m._id} music={m} index={i} onPlay={onPlay} />)}
      </div>
    </div>
  );
}

function ArtistDashboard({ musics, setNotice, refresh }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [albumTitle, setAlbumTitle] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    e.preventDefault();
    if (!title || !file) return setNotice("Enter a title and choose an audio file.");
    setBusy(true);
    try {
      await musicApi.upload(title, file);
      setTitle(""); setFile(null);
      e.target.reset();
      setNotice("Music uploaded successfully.");
      await refresh();
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  };

  const createAlbum = async (e) => {
    e.preventDefault();
    if (!albumTitle || !selected.length) return setNotice("Enter an album title and select at least one track.");
    setBusy(true);
    try {
      await musicApi.createAlbum(albumTitle, selected);
      setAlbumTitle(""); setSelected([]);
      setNotice("Album created successfully.");
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="page">
      <div className="page-heading">
        <div><p className="eyebrow">ARTIST</p><h1>Artist Studio</h1></div>
      </div>

      <div className="studio-grid">
        <form className="panel" onSubmit={upload}>
          <div className="panel-icon"><Upload /></div>
          <h2>Upload music</h2>
          <p>Add a new track to your Spotify clone.</p>
          <label>Track title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Midnight Drive" />
          <label>Audio file</label>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0])} />
          <button className="green-btn full" disabled={busy}>{busy ? "Uploading..." : "Upload track"}</button>
        </form>

        <form className="panel" onSubmit={createAlbum}>
          <div className="panel-icon"><Disc3 /></div>
          <h2>Create album</h2>
          <p>Group uploaded tracks into an album.</p>
          <label>Album title</label>
          <input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="e.g. Neon Nights" />
          <label>Select tracks</label>
          <div className="select-tracks">
            {musics.map((m) => (
              <label className="check-row" key={m._id}>
                <input
                  type="checkbox"
                  checked={selected.includes(m._id)}
                  onChange={(e) => setSelected((old) =>
                    e.target.checked ? [...old, m._id] : old.filter((id) => id !== m._id)
                  )}
                />
                <span>{m.title}</span>
              </label>
            ))}
          </div>
          <button className="green-btn full" disabled={busy}>Create album</button>
        </form>
      </div>
    </div>
  );
}

function Profile({ user, logout }) {
  return (
    <div className="page">
      <div className="profile-card">
        <div className="large-avatar">{user.username?.[0]?.toUpperCase()}</div>
        <p className="eyebrow">ACCOUNT</p>
        <h1>{user.username}</h1>
        <p>{user.email}</p>
        <span className="role-badge">{user.role}</span>
        <button className="danger-btn" onClick={logout}>Log out</button>
      </div>
    </div>
  );
}

function Player({ music, playing, setPlaying }) {
  const audioUrl = music?.uri;
  return (
    <footer className="player">
      <div className="now-playing">
        {music ? <Cover title={music.title} index={1} small /> : <div className="empty-cover"><Music2 /></div>}
        <div>
          <strong>{music?.title || "Nothing playing"}</strong>
          <span>{music?.artist?.username || "Choose a track"}</span>
        </div>
        <button className="icon-btn"><Heart size={18} /></button>
      </div>

      <div className="player-center">
        <div className="controls">
          <button><SkipBack /></button>
          <button className="main-play" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
          </button>
          <button><SkipForward /></button>
        </div>
        <div className="progress">
          <span>0:00</span><div className="progress-line"><div style={{ width: playing ? "38%" : "0%" }} /></div><span>--:--</span>
        </div>
      </div>

      <div className="volume"><Volume2 size={18} /><div className="volume-line"><div style={{ width: "70%" }} /></div></div>
      {audioUrl && (
        <audio
          src={audioUrl}
          autoPlay={playing}
          onEnded={() => setPlaying(false)}
          style={{ display: "none" }}
        />
      )}
    </footer>
  );
}

function TrackCard({ music, index, onPlay }) {
  return (
    <article className="track-card" onDoubleClick={() => onPlay(music)}>
      <div className="cover-wrap">
        <Cover title={music.title} index={index} />
        <button className="floating-play" onClick={() => onPlay(music)}><Play fill="currentColor" size={20} /></button>
      </div>
      <strong>{music.title}</strong>
      <span>{music.artist?.username || "Artist"}</span>
    </article>
  );
}

function TrackRow({ music, index, onPlay }) {
  return (
    <div className="track-row">
      <span className="track-number">{index + 1}</span>
      <Cover title={music.title} index={index} small />
      <div className="track-info">
        <strong>{music.title}</strong>
        <span>{music.artist?.username || "Artist"}</span>
      </div>
      <button className="row-play" onClick={() => onPlay(music)}><Play fill="currentColor" size={17} /></button>
    </div>
  );
}

function AlbumCard({ album, index, onClick }) {
  return (
    <article className="album-card" onClick={onClick}>
      <Cover title={album.title} index={index} />
      <strong>{album.title}</strong>
      <span>{album.artist?.username || "Artist"}</span>
    </article>
  );
}

function SectionTitle({ title }) {
  return <div className="section-title"><h2>{title}</h2><button>Show all</button></div>;
}

function EmptyState({ text }) {
  return <div className="empty-state"><Music2 size={32} /><p>{text}</p></div>;
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const payload = mode === "login"
        ? { username: username || undefined, email: email || undefined, password }
        : { username, email, password, role };
      const response = mode === "login" ? await authApi.login(payload) : await authApi.register(payload);
      onLogin(response.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
      <img src="/spotify-logo.png" alt="Spotify" />
      <span>Spotify</span>
        </div>
      <div className="auth-card">
        <h1>{mode === "login" ? "Log in to Spotify" : "Create your account"}</h1>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={submit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" required={mode === "register"} />
          {mode === "register" && <>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
            <label>Account type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Listener</option>
              <option value="artist">Artist</option>
            </select>
          </>}
          {mode === "login" && <label>Email <span className="muted">(or use username)</span></label>}
          {mode === "login" && <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />}
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
          <button className="green-btn full" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log In" : "Sign Up"}</button>
        </form>
        <div className="auth-switch">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;