import {readFile} from "node:fs/promises";
import path from "node:path";
import {FrenchWardInstitutionalProfileView, type FrenchWardProfileContent} from "./FrenchWardInstitutionalProfileView";
import styles from "./FrenchWardInstitutionalProfileView.module.css";

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]!));
/** Same publication component and stylesheet as the qualified reader; no separate content projection. */
export async function renderFrenchWardProfileHtml(profile: FrenchWardProfileContent) {
  const nodeProcess = process as typeof process & {
    getBuiltinModule(id: string): typeof import("node:module");
  };
  const nodeModule = nodeProcess.getBuiltinModule("node:module");
  const nativeRequire = nodeModule.createRequire(
    path.join(process.cwd(), "package.json")
  );
  const {renderToStaticMarkup} = nativeRequire(
    "react-dom/server"
  ) as typeof import("react-dom/server");
  const [sourceCss, hero] = await Promise.all([
    readFile(path.join(process.cwd(), "src/components/french-ward/profile/FrenchWardInstitutionalProfileView.module.css"), "utf8"),
    readFile(path.join(process.cwd(), "public/french-ward/fw-profile-open-passage.webp")),
  ]);
  const css = sourceCss.replace(/\.([A-Za-z_][\w-]*)/g, (token, key: string) => styles[key] ? "." + styles[key] : token)
    .replaceAll("/french-ward/fw-profile-open-passage.webp", "data:image/webp;base64," + hero.toString("base64"));
  if (/@import\b/i.test(css) || [...css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)].some(match => !/^(data:|#)/i.test(match[2]))) throw new Error("PROFILE_EXPORT_EXTERNAL_STYLE_DEPENDENCY");
  const markup = renderToStaticMarkup(<FrenchWardInstitutionalProfileView profile={profile} />);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' + escape(profile.displayName + " · " + profile.reference + " · Edition " + profile.version) + '</title><style>html{scroll-behavior:smooth}body{margin:0;background:#08111a}*,*::before,*::after{box-sizing:border-box}' + css.replace(/<\/style/gi,"<\\/style") + '</style></head><body>' + markup + '</body></html>';
}
