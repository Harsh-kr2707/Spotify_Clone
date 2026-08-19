const API_BASE_URL = import.meta.env.VITE_API_URL ||"";
const api = async (path, options = {}) => {
  const config = {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(`${API_BASE_URL}${path}`, config);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong");
  }

  return data;
};

export const authApi = {
  register: (payload) =>
    api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () => api("/api/auth/logout", { method: "POST" }),
};

export const musicApi = {
  all: () => api("/api/music/"),
  albums: () => api("/api/music/albums"),
  album: (id) => api(`/api/music/albums/${id}`),
  upload: (title, file) => {
    const form = new FormData();
    form.append("title", title);
    form.append("music", file);
    return api("/api/music/upload", { method: "POST", body: form });
  },
  createAlbum: (title, musics) =>
    api("/api/music/album", {
      method: "POST",
      body: JSON.stringify({ title, musics }),
    }),
};