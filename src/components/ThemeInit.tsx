import Script from "next/script";

// Runs before paint to avoid a flash of the wrong theme when the admin app
// loads. Only ever touches the `data-theme` attribute; the actual color
// tokens are all in globals.css.
const THEME_INIT_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem("serenite-theme");
      var theme = stored === "dark" || stored === "light"
        ? stored
        : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
    } catch (e) {}
  })();
`;

export function ThemeInit() {
  return (
    // beforeInteractive in the root layout's <body> is the documented App
    // Router equivalent of pages/_document.js — this rule predates App Router.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="theme-init" strategy="beforeInteractive">
      {THEME_INIT_SCRIPT}
    </Script>
  );
}
