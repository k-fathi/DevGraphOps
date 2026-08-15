import axios from "axios";

const targets = [
  "https://api.bitbucket.org/2.0/repositories/fargo3d/public",
  "https://api.bitbucket.org/2.0/repositories/fargo3d/public/src/?pagelen=100",
  "https://bitbucket.org/api/2.0/repositories/fargo3d/public",
  "https://bitbucket.org/fargo3d/public/raw/master/README.md",
  "https://gitlab.com/api/v4/projects/gitlab-org%2Fcli",
];

for (const target of targets) {
  const response = await fetch(target, { headers: { "User-Agent": "Repogram/1.0 (public repository analysis)" } });
  const body = (await response.text()).slice(0, 160).replace(/\s+/g, " ");
  console.log(JSON.stringify({ target, status: response.status, body }));
}

for (const target of targets.slice(0, 2)) {
  const response = await axios.get(target, { headers: { "User-Agent": "Repogram/1.0 (public repository analysis)" }, validateStatus: () => true });
  console.log(JSON.stringify({ transport: "axios", target, status: response.status, body: String(response.data).slice(0, 160).replace(/\s+/g, " ") }));
}
