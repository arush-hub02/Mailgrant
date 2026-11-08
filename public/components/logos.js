/**
 * Mailgrant Authentic Provider & Company Brand Logo System
 * Provides authentic, crisp vector SVGs for email providers (Gmail, Outlook, iCloud, etc.)
 * and company services (Claude, Notion, Figma, GitHub, Google, Slack, etc.).
 */

export const providerLogos = {
  // Official Multi-Color Google / Gmail Logo
  gmail: (size = 28) => `
    <svg class="brand-logo logo-gmail" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Gmail" role="img">
      <path fill="#EA4335" d="M12 13L2.5 6.5C2.19 6.28 2 5.92 2 5.54C2 4.69 2.69 4 3.54 4H20.46C21.31 4 22 4.69 22 5.54C22 5.92 21.81 6.28 21.5 6.5L12 13Z"/>
      <path fill="#4285F4" d="M2 7.5V18.5C2 19.33 2.67 20 3.5 20H7V11L2 7.5Z"/>
      <path fill="#34A853" d="M22 7.5L17 11V20H20.5C21.33 20 22 19.33 22 18.5V7.5Z"/>
      <path fill="#FBBC05" d="M7 20H17V12L12 15.5L7 12V20Z"/>
    </svg>
  `,

  // Official Microsoft Outlook Logo
  outlook: (size = 28) => `
    <svg class="brand-logo logo-outlook" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Microsoft Outlook" role="img">
      <path fill="#0078D4" d="M18 5h9c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2h-9V5z"/>
      <path fill="#28A8EA" d="M18 5L29 14v13H18V5z"/>
      <path fill="#005A9E" d="M18 18.5l11 8.5H18v-8.5z"/>
      <path fill="#0078D4" d="M3 8.5C3 7.12 4.12 6 5.5 6h9C15.88 6 17 7.12 17 8.5v15c0 1.38-1.12 2.5-2.5 2.5h-9C4.12 26 3 24.88 3 23.5v-15z"/>
      <ellipse cx="10" cy="16" rx="4" ry="4.5" fill="#FFFFFF"/>
      <ellipse cx="10" cy="16" rx="2" ry="2.5" fill="#0078D4"/>
    </svg>
  `,

  // Official Apple iCloud / Apple Mail Logo
  icloud: (size = 28) => `
    <svg class="brand-logo logo-apple" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Apple Mail" role="img">
      <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.18.66-2.85 1.47-.59.71-1.11 1.87-.97 2.98 1.07.08 2.2-.55 2.83-1.35z"/>
    </svg>
  `,

  // Official Yahoo Mail Logo
  yahoo: (size = 28) => `
    <svg class="brand-logo logo-yahoo" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Yahoo Mail" role="img">
      <path fill="#6001D2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-4.5L7.5 5.5h2.2L12 10.3l2.3-4.8h2.2L13 12v4.5z"/>
    </svg>
  `,

  // Official Proton Mail Logo
  proton: (size = 28) => `
    <svg class="brand-logo logo-proton" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Proton Mail" role="img">
      <path fill="#6D4AFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c2.21 0 4 1.79 4 4v2h-8v-2c0-2.21 1.79-4 4-4zm-6 8v-1h12v1c0 3.31-2.69 6-6 6s-6-2.69-6-6z"/>
    </svg>
  `,

  // Fastmail Logo
  fastmail: (size = 28) => `
    <svg class="brand-logo logo-fastmail" viewBox="0 0 24 24" width="${size}" height="${size}" aria-label="Fastmail" role="img">
      <circle cx="12" cy="12" r="10" fill="#0C2340"/>
      <path fill="#F36F21" d="M6 14l6-6 6 6H6z"/>
    </svg>
  `,

  // Generic / Custom Domain Mailbox
  custom: (size = 28) => `
    <svg class="brand-logo logo-custom" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Mailbox" role="img">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  `
};

/**
 * Company Service Logos (Claude, Notion, Figma, GitHub, etc.)
 */
export const companyLogos = {
  claude: (size = 36) => `
    <svg class="company-logo logo-claude" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Claude" role="img">
      <rect width="32" height="32" rx="8" fill="#D97757"/>
      <g transform="translate(5, 5) scale(0.916)">
        <path fill="#FAF4EB" d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 3.197z"/>
      </g>
    </svg>
  `,

  notion: (size = 36) => `
    <svg class="company-logo logo-notion" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Notion" role="img">
      <rect width="32" height="32" rx="8" fill="#000000"/>
      <path fill="#FFFFFF" d="M9 10.2l9.8-2.1c.8-.2 1.5.4 1.5 1.2v12.8c0 .8-.6 1.3-1.4 1.4L9.4 25.5c-.8.2-1.4-.4-1.4-1.2V11.4c0-.7.5-1.2 1-1.2zm3 2.9v8.4l6-1.4v-8.4l-6 1.4z"/>
    </svg>
  `,

  figma: (size = 36) => `
    <svg class="company-logo logo-figma" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Figma" role="img">
      <rect width="32" height="32" rx="8" fill="#1E1E1E"/>
      <g transform="translate(6, 4) scale(0.85)">
        <path fill="#F24E1E" d="M8 12a4 4 0 1 1 0-8h4v8H8z"/>
        <path fill="#FF7262" d="M12 4h4a4 4 0 1 1 0 8h-4V4z"/>
        <path fill="#A259FF" d="M12 12h4a4 4 0 1 1 0 8h-4v-8z"/>
        <path fill="#0ACF83" d="M8 20a4 4 0 1 1 0-8h4v4a4 4 0 0 1-4 4z"/>
        <path fill="#1ABCFE" d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>
      </g>
    </svg>
  `,

  github: (size = 36) => `
    <svg class="company-logo logo-github" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="GitHub" role="img">
      <rect width="32" height="32" rx="8" fill="#24292e"/>
      <path fill="#ffffff" fill-rule="evenodd" clip-rule="evenodd" d="M16 6C10.477 6 6 10.484 6 16.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0116 10.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0026 16.017C26 10.484 21.522 6 16 6z"/>
    </svg>
  `,

  google: (size = 36) => `
    <svg class="company-logo logo-google" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Google" role="img">
      <rect width="32" height="32" rx="8" fill="#ffffff"/>
      <g transform="translate(4, 4) scale(1)">
        <path fill="#EA4335" d="M12 13L2.5 6.5C2.19 6.28 2 5.92 2 5.54C2 4.69 2.69 4 3.54 4H20.46C21.31 4 22 4.69 22 5.54C22 5.92 21.81 6.28 21.5 6.5L12 13Z"/>
        <path fill="#4285F4" d="M2 7.5V18.5C2 19.33 2.67 20 3.5 20H7V11L2 7.5Z"/>
        <path fill="#34A853" d="M22 7.5L17 11V20H20.5C21.33 20 22 19.33 22 18.5V7.5Z"/>
        <path fill="#FBBC05" d="M7 20H17V12L12 15.5L7 12V20Z"/>
      </g>
    </svg>
  `,

  slack: (size = 36) => `
    <svg class="company-logo logo-slack" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Slack" role="img">
      <rect width="32" height="32" rx="8" fill="#4A154B"/>
      <g transform="translate(6, 6) scale(0.8)">
        <path fill="#ECB22E" d="M4 12.5a2.5 2.5 0 0 1 2.5-2.5h2.5v2.5A2.5 2.5 0 0 1 6.5 15H4v-2.5zm4 0a2.5 2.5 0 0 1 5 0V15H8v-2.5z"/>
        <path fill="#36C5F0" d="M12.5 4a2.5 2.5 0 0 1 2.5 2.5v2.5h-2.5A2.5 2.5 0 0 1 10 6.5V4h2.5zm0 4a2.5 2.5 0 0 1 0 5H10V8h2.5z"/>
        <path fill="#2EB67D" d="M21 12.5a2.5 2.5 0 0 1-2.5 2.5h-2.5v-2.5A2.5 2.5 0 0 1 18.5 10H21v2.5zm-4 0a2.5 2.5 0 0 1-5 0V10h5v2.5z"/>
        <path fill="#E01E5A" d="M12.5 21a2.5 2.5 0 0 1-2.5-2.5v-2.5h2.5a2.5 2.5 0 0 1 2.5 2.5V21h-2.5zm0-4a2.5 2.5 0 0 1 0-5H15v5h-2.5z"/>
      </g>
    </svg>
  `,

  stripe: (size = 36) => `
    <svg class="company-logo logo-stripe" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Stripe" role="img">
      <rect width="32" height="32" rx="8" fill="#635BFF"/>
      <path fill="#ffffff" d="M14.8 13.5c0-.9.7-1.3 1.9-1.3 1.7 0 3.8.5 5.5 1.4v-4.6c-1.8-.7-3.7-1-5.5-1-4.6 0-7.7 2.4-7.7 6.4 0 6.3 8.6 5.3 8.6 8 0 1.1-1 1.4-2.3 1.4-2 0-4.5-.8-6.5-1.9v4.7c2.2.9 4.4 1.4 6.5 1.4 4.8 0 8.2-2.3 8.2-6.5-.1-6.8-8.7-5.6-8.7-8z"/>
    </svg>
  `,

  openai: (size = 36) => `
    <svg class="company-logo logo-openai" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="OpenAI" role="img">
      <rect width="32" height="32" rx="8" fill="#10A37F"/>
      <g transform="translate(5, 5) scale(0.916)">
        <path fill="#FFFFFF" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
      </g>
    </svg>
  `,

  aws: (size = 36) => `
    <svg class="company-logo logo-aws" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="AWS" role="img">
      <rect width="32" height="32" rx="8" fill="#232F3E"/>
      <path fill="#FF9900" d="M10 18c3.5 2.2 8.5 2.2 12 0-.3.4-.9.9-1.5 1.1-2.9 1.2-6.5 1.1-9.3-.3-.4-.2-.9-.5-1.2-.8zm12.5.5c.3-.5.7-1.3.6-2.1-.6.5-1.5.8-2.3.9.7.5 1.4.9 1.7 1.2z"/>
      <path fill="#ffffff" d="M11 10.5l-2.5 6h1.6l.5-1.4h2.8l.5 1.4h1.6l-2.5-6h-2zm-.2 3.4l.9-2.5.9 2.5h-1.8z"/>
    </svg>
  `,

  apple: (size = 36) => `
    <svg class="company-logo logo-apple" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Apple" role="img">
      <rect width="32" height="32" rx="8" fill="#121212"/>
      <path fill="#FFFFFF" d="M21.2 16.8c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-2-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.8 1.3 10.3.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.9-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-3 1.5-3.1-.1-.1-2.7-1-2.7-3.9zM18.8 9.3c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/>
    </svg>
  `,

  microsoft: (size = 36) => `
    <svg class="company-logo logo-microsoft" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Microsoft" role="img">
      <rect width="32" height="32" rx="8" fill="#1f1f1f"/>
      <g transform="translate(6, 6) scale(0.625)">
        <rect x="2" y="2" width="13" height="13" fill="#F25022"/>
        <rect x="17" y="2" width="13" height="13" fill="#7FBA00"/>
        <rect x="2" y="17" width="13" height="13" fill="#00A4EF"/>
        <rect x="17" y="17" width="13" height="13" fill="#FFB900"/>
      </g>
    </svg>
  `,

  linear: (size = 36) => `
    <svg class="company-logo logo-linear" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Linear" role="img">
      <rect width="32" height="32" rx="8" fill="#5E6AD2"/>
      <g transform="translate(6, 6) scale(0.625)" fill="#FFFFFF">
        <path d="M1.5 16C1.5 7.99 7.99 1.5 16 1.5c4.08 0 7.76 1.7 10.37 4.45L4.85 27.5C2.79 24.52 1.5 20.44 1.5 16zm26.65 9.05C25.8 28.52 21.2 30.5 16 30.5c-4.08 0-7.76-1.7-10.37-4.45L27.15 4.5c2.06 2.98 3.35 7.06 3.35 11.5 0 3.35-.91 6.48-2.35 9.05z"/>
      </g>
    </svg>
  `,

  twitter: (size = 36) => `
    <svg class="company-logo logo-x" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="X" role="img">
      <rect width="32" height="32" rx="8" fill="#000000"/>
      <path fill="#FFFFFF" d="M18.8 14.3L25.3 6.8h-1.5l-5.6 6.5-4.5-6.5H8.6l6.8 9.9L8.6 24.8h1.5l5.9-6.9 4.8 6.9h5.1L18.8 14.3zm-2.1 2.5l-.7-1-5.5-7.8h2.3l4.5 6.4.7 1 5.8 8.2h-2.3l-4.8-6.8z"/>
    </svg>
  `,

  discord: (size = 36) => `
    <svg class="company-logo logo-discord" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Discord" role="img">
      <rect width="32" height="32" rx="8" fill="#5865F2"/>
      <path fill="#FFFFFF" d="M22.5 9.5a13.8 13.8 0 0 0-3.5-1.1c-.2.3-.4.7-.5 1-1.3-.2-2.7-.2-4 0-.1-.3-.3-.7-.5-1A13.8 13.8 0 0 0 10.5 9.5C7.7 13.7 7 17.8 7.3 21.8a13.9 13.9 0 0 0 4.2 2.1c.3-.5.7-.9 1-1.4-1.5-.5-2-1.5-2-1.5.1.1.3.2.4.3 1.4.8 3.2 1.3 5.1 1.3s3.7-.5 5.1-1.3c.2-.1.3-.2.4-.3 0 0-.6 1-2 1.5.3.5.7.9 1 1.4a13.9 13.9 0 0 0 4.2-2.1c.5-4.6-.9-8.7-3.7-12.8zm-8.8 9.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2zm5.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2z"/>
    </svg>
  `,

  netflix: (size = 36) => `
    <svg class="company-logo logo-netflix" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Netflix" role="img">
      <rect width="32" height="32" rx="8" fill="#000000"/>
      <path fill="#E50914" d="M10 6v20h3.5V13.5l5 12.5H22V6h-3.5v12.5L13.5 6H10z"/>
    </svg>
  `,

  spotify: (size = 36) => `
    <svg class="company-logo logo-spotify" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Spotify" role="img">
      <rect width="32" height="32" rx="8" fill="#121212"/>
      <circle cx="16" cy="16" r="10" fill="#1ED760"/>
      <path fill="#121212" d="M20.5 19.3a.6.6 0 0 1-.9.2c-2.4-1.5-5.5-1.8-9.1-1a.6.6 0 1 1-.3-1.2c4-.9 7.4-.5 10.1 1.1.3.3.4.6.2.9zm1.3-3c-.2.4-.6.5-1 .3-2.8-1.7-7-2.2-10.3-1.2a.8.8 0 1 1-.4-1.5c3.8-1.1 8.4-.6 11.4 1.4.4.3.5.7.3 1zm.1-3.1C18.6 11.2 13 11 9.8 12a1 1 0 0 1-.6-1.9c3.7-1.1 9.8-.9 13.7 1.4a1 1 0 0 1-.9 1.7z"/>
    </svg>
  `,

  vercel: (size = 36) => `
    <svg class="company-logo logo-vercel" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Vercel" role="img">
      <rect width="32" height="32" rx="8" fill="#000000"/>
      <path fill="#FFFFFF" d="M16 8l8.5 15H7.5L16 8z"/>
    </svg>
  `,

  supabase: (size = 36) => `
    <svg class="company-logo logo-supabase" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Supabase" role="img">
      <rect width="32" height="32" rx="8" fill="#1C1C1C"/>
      <path fill="#3ECF8E" d="M17.5 5.5l-9 12h8l-2 9 9-12h-8l2-9z"/>
    </svg>
  `,

  gitlab: (size = 36) => `
    <svg class="company-logo logo-gitlab" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="GitLab" role="img">
      <rect width="32" height="32" rx="8" fill="#292961"/>
      <g transform="translate(6, 6) scale(0.625)">
        <path fill="#E24329" d="M16 26.5L20.8 12H11.2L16 26.5z"/>
        <path fill="#FC6D26" d="M16 26.5L11.2 12H2.5L16 26.5z"/>
        <path fill="#FCA326" d="M2.5 12L1 16.5c-.3.8 0 1.7.7 2.2L16 26.5 11.2 12H2.5z"/>
        <path fill="#E24329" d="M2.5 12h8.7L7.5 2.5c-.3-.9-1.5-.9-1.8 0L2.5 12z"/>
        <path fill="#FC6D26" d="M16 26.5L20.8 12h8.7L16 26.5z"/>
        <path fill="#FCA326" d="M29.5 12L31 16.5c.3.8 0 1.7-.7 2.2L16 26.5 20.8 12h8.7z"/>
        <path fill="#E24329" d="M29.5 12h-8.7l3.7-9.5c.3-.9 1.5-.9 1.8 0l3.2 9.5z"/>
      </g>
    </svg>
  `,

  dropbox: (size = 36) => `
    <svg class="company-logo logo-dropbox" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Dropbox" role="img">
      <rect width="32" height="32" rx="8" fill="#0061FF"/>
      <g transform="translate(6, 6) scale(0.625)" fill="#FFFFFF">
        <path d="M6 3.5L1 7.2l5 3.8 5-3.8L6 3.5zm14 0l-5 3.7 5 3.8 5-3.8-5-3.7zM1 14.8l5 3.8 5-3.8-5-3.7-5 3.7zm19 0l-5-3.7-5 3.7 5 3.8 5-3.8zM11 20.2l-5 3.8L11 28l5-4-5-3.8z"/>
      </g>
    </svg>
  `,

  zoom: (size = 36) => `
    <svg class="company-logo logo-zoom" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Zoom" role="img">
      <rect width="32" height="32" rx="8" fill="#2D8CFF"/>
      <path fill="#FFFFFF" d="M7 11.5C7 10.7 7.7 10 8.5 10h10c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-10c-.8 0-1.5-.7-1.5-1.5v-9zm14 2.8l4-2.8v9l-4-2.8v-3.4z"/>
    </svg>
  `,

  linkedin: (size = 36) => `
    <svg class="company-logo logo-linkedin" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="LinkedIn" role="img">
      <rect width="32" height="32" rx="8" fill="#0A66C2"/>
      <path fill="#FFFFFF" d="M10 13h3v9h-3v-9zm1.5-4.5c1 0 1.7.8 1.7 1.7 0 1-.7 1.8-1.7 1.8s-1.8-.8-1.8-1.8c0-1 .8-1.7 1.8-1.7zM15 13h2.9v1.3h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.7V22h-3v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2V22H15v-9z"/>
    </svg>
  `,

  adobe: (size = 36) => `
    <svg class="company-logo logo-adobe" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Adobe" role="img">
      <rect width="32" height="32" rx="8" fill="#EB1000"/>
      <path fill="#FFFFFF" d="M18.8 7H25v18l-6.2-18zm-5.6 0H7v18l6.2-18zm2.8 6.5l3.5 10.3h-2.8l-1.3-4.1h-3.3l3.9-6.2z"/>
    </svg>
  `,

  canva: (size = 36) => `
    <svg class="company-logo logo-canva" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Canva" role="img">
      <rect width="32" height="32" rx="8" fill="#00C4CC"/>
      <path fill="#FFFFFF" d="M19.5 13c-1.2-1.3-3.1-1.8-5-1.3-3.4.9-5.1 4.5-4 7.6.8 2.2 3.2 3.5 5.5 3 2.1-.4 3.7-2 4.2-3.8h-2.3c-.4.9-1.2 1.7-2.3 1.9-1.4.3-2.8-.5-3.3-1.8-.6-1.7.4-3.7 2.2-4.2 1.2-.3 2.3 0 3.1.8l1.8-2.2z"/>
    </svg>
  `,

  atlassian: (size = 36) => `
    <svg class="company-logo logo-atlassian" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Atlassian" role="img">
      <rect width="32" height="32" rx="8" fill="#0052CC"/>
      <g transform="translate(6, 6) scale(0.625)" fill="#FFFFFF">
        <path d="M16 2.5C12.3 8.3 12 12.8 14.5 16.5c2.5 3.6 7.1 6.1 10.3 5.4 1-.2 1.8-.7 2.4-1.3-3.8-.5-7.3-3.7-8.4-7.4-1.2-4.1-.7-7.9-2.8-10.7z"/>
        <path d="M10.2 13.5C8 16.7 6.4 20.3 7 24.3c.3 1.9 1.4 3.6 3 4.5-.4-1.4-.2-2.9.5-4.2 1.3-2.5 3.8-4.2 6.5-4.8-2.7-1.3-5-3.5-6.8-6.3z" opacity="0.8"/>
      </g>
    </svg>
  `,

  docker: (size = 36) => `
    <svg class="company-logo logo-docker" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Docker" role="img">
      <rect width="32" height="32" rx="8" fill="#1D63ED"/>
      <g transform="translate(5, 7) scale(0.68)" fill="#FFFFFF">
        <rect x="8" y="4" width="3" height="3" rx="0.5"/>
        <rect x="12" y="4" width="3" height="3" rx="0.5"/>
        <rect x="16" y="4" width="3" height="3" rx="0.5"/>
        <rect x="4" y="8" width="3" height="3" rx="0.5"/>
        <rect x="8" y="8" width="3" height="3" rx="0.5"/>
        <rect x="12" y="8" width="3" height="3" rx="0.5"/>
        <rect x="16" y="8" width="3" height="3" rx="0.5"/>
        <rect x="20" y="8" width="3" height="3" rx="0.5"/>
        <path d="M28.5 11c-.5-.4-1.5-.3-2.2.1-.3-.9-1-1.6-1.9-2-.4-.2-.8-.3-1.3-.3h-1.8v3.5H1c-.6 0-1 .4-1 1 0 4.5 3.2 8.7 8.5 8.7 7.2 0 12.3-3.8 14.8-8.8 2.2.1 4.2-1 5.2-2.2z"/>
      </g>
    </svg>
  `,

  uber: (size = 36) => `
    <svg class="company-logo logo-uber" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Uber" role="img">
      <rect width="32" height="32" rx="8" fill="#000000"/>
      <g transform="translate(6, 6) scale(0.625)" fill="#FFFFFF">
        <path d="M16 3C8.8 3 3 8.8 3 16s5.8 13 13 13 13-5.8 13-13S23.2 3 16 3zm0 21c-4.4 0-8-3.6-8-8s3.6-8 8-8c2.9 0 5.4 1.5 6.8 3.8H16v8.4h7.6c-1.6 2.3-4.2 3.8-7.6 3.8z"/>
      </g>
    </svg>
  `,

  airbnb: (size = 36) => `
    <svg class="company-logo logo-airbnb" viewBox="0 0 32 32" width="${size}" height="${size}" aria-label="Airbnb" role="img">
      <rect width="32" height="32" rx="8" fill="#FF5A5F"/>
      <g transform="translate(6, 5) scale(0.65)" fill="#FFFFFF">
        <path d="M16 1c-4.8 0-8 3.5-8 7.5 0 3.8 2.4 8.2 6.7 13.8.4.5.9 1 1.3 1.5.4-.5.9-1 1.3-1.5C21.6 16.7 24 12.3 24 8.5 24 4.5 20.8 1 16 1zm0 10.5c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
      </g>
    </svg>
  `
};

/**
 * Check if an authentic vector company logo exists in the catalog.
 * @param {string} nameOrSender
 * @returns {boolean}
 */
export function hasCompanyLogo(nameOrSender = '') {
  const str = String(nameOrSender).toLowerCase().trim();
  const known = [
    'claude', 'anthropic', 'notion', 'figma', 'github', 'gitlab', 'google', 'gmail',
    'outlook', 'microsoft', 'office', 'apple', 'icloud', 'slack', 'stripe', 'openai',
    'chatgpt', 'aws', 'amazon', 'linear', 'discord', 'netflix', 'spotify', 'vercel',
    'supabase', 'dropbox', 'zoom', 'linkedin', 'adobe', 'canva', 'atlassian', 'jira',
    'docker', 'uber', 'airbnb', 'twitter'
  ];
  return known.some(k => str.includes(k) || str === 'x');
}

/**
 * Determine and render the authentic email provider logo on the basis of the mailbox name or email address.
 * E.g. Gmail for Google/Gmail, Outlook for Microsoft, iCloud for Apple, etc.
 * 
 * @param {string} emailOrName
 * @param {number} [size=28]
 * @returns {string} SVG HTML string
 */
export function getMailboxLogo(emailOrName = '', size = 28, providerOrFlag = '') {
  const str = String(emailOrName || '').toLowerCase();
  const prov = String(providerOrFlag || '').toLowerCase();

  if (prov === 'microsoft' || prov === 'outlook' || prov === 'hotmail' || str.includes('outlook') || str.includes('hotmail') || str.includes('live.com') || str.includes('microsoft') || str.includes('office') || str.includes('msn.com')) {
    return providerLogos.outlook(size);
  }
  if (prov === 'yahoo' || str.includes('yahoo') || str.includes('ymail.com') || str.includes('rocketmail.com')) {
    return providerLogos.yahoo(size);
  }
  if (prov === 'apple' || prov === 'icloud' || str.includes('icloud') || str.includes('me.com') || str.includes('mac.com') || str.includes('apple')) {
    return providerLogos.icloud(size);
  }
  if (prov === 'proton' || str.includes('proton') || str.includes('pm.me')) {
    return providerLogos.proton(size);
  }
  if (prov === 'fastmail' || str.includes('fastmail')) {
    return providerLogos.fastmail(size);
  }
  if (prov === 'zoho' || str.includes('zoho')) {
    return providerLogos.zoho(size);
  }
  if (prov === 'google' || prov === 'gmail' || prov === 'true' || str.includes('gmail') || str.includes('google') || str.endsWith('@googlemail.com')) {
    return providerLogos.gmail(size);
  }

  // Fallback: Default to custom or sample
  if (str.includes('mailgrant') || str.includes('sample')) {
    return providerLogos.gmail(size);
  }

  return providerLogos.custom(size);
}

export function getProviderDisplayName(provider = '') {
  const p = String(provider || '').toLowerCase();
  switch (p) {
    case 'google':
    case 'gmail':
      return 'Google Gmail';
    case 'microsoft':
    case 'outlook':
    case 'hotmail':
      return 'Microsoft Outlook / Hotmail';
    case 'yahoo':
      return 'Yahoo Mail';
    case 'apple':
    case 'icloud':
      return 'Apple iCloud';
    case 'proton':
      return 'ProtonMail';
    case 'zoho':
      return 'Zoho Mail';
    case 'fastmail':
      return 'Fastmail';
    default:
      return 'Inbound Mail Stream';
  }
}

/**
 * Determine and render the authentic brand/company logo on the basis of sender or company name.
 * Used across the Shared Inbox, Dashboard, and Rules pages.
 * 
 * @param {string} nameOrSender
 * @param {number} [size=36]
 * @param {number} [fallbackIndex=0]
 * @returns {string} SVG or fallback vendor avatar
 */
export function getCompanyLogo(nameOrSender = '', size = 36, fallbackIndex = 0) {
  const str = String(nameOrSender).toLowerCase();

  if (str.includes('claude') || str.includes('anthropic')) {
    return companyLogos.claude(size);
  }
  if (str.includes('notion')) {
    return companyLogos.notion(size);
  }
  if (str.includes('figma')) {
    return companyLogos.figma(size);
  }
  if (str.includes('github')) {
    return companyLogos.github(size);
  }
  if (str.includes('gitlab')) {
    return companyLogos.gitlab(size);
  }
  if (str.includes('google') || str.includes('gmail')) {
    return companyLogos.google(size);
  }
  if (str.includes('outlook') || str.includes('microsoft') || str.includes('office') || str.includes('hotmail') || str.includes('live.com') || str.includes('msn.com')) {
    return companyLogos.microsoft(size);
  }
  if (str.includes('apple') || str.includes('icloud')) {
    return companyLogos.apple(size);
  }
  if (str.includes('slack')) {
    return companyLogos.slack(size);
  }
  if (str.includes('stripe')) {
    return companyLogos.stripe(size);
  }
  if (str.includes('openai') || str.includes('chatgpt')) {
    return companyLogos.openai(size);
  }
  if (str.includes('aws') || str.includes('amazon')) {
    return companyLogos.aws(size);
  }
  if (str.includes('linear')) {
    return companyLogos.linear(size);
  }
  if (str.includes('discord')) {
    return companyLogos.discord(size);
  }
  if (str.includes('netflix')) {
    return companyLogos.netflix(size);
  }
  if (str.includes('spotify')) {
    return companyLogos.spotify(size);
  }
  if (str.includes('vercel')) {
    return companyLogos.vercel(size);
  }
  if (str.includes('supabase')) {
    return companyLogos.supabase(size);
  }
  if (str.includes('dropbox')) {
    return companyLogos.dropbox(size);
  }
  if (str.includes('zoom')) {
    return companyLogos.zoom(size);
  }
  if (str.includes('linkedin')) {
    return companyLogos.linkedin(size);
  }
  if (str.includes('adobe')) {
    return companyLogos.adobe(size);
  }
  if (str.includes('canva')) {
    return companyLogos.canva(size);
  }
  if (str.includes('atlassian') || str.includes('jira')) {
    return companyLogos.atlassian(size);
  }
  if (str.includes('docker')) {
    return companyLogos.docker(size);
  }
  if (str.includes('uber')) {
    return companyLogos.uber(size);
  }
  if (str.includes('airbnb')) {
    return companyLogos.airbnb(size);
  }
  if (str.includes('twitter') || str === 'x' || str.includes('x.com')) {
    return companyLogos.twitter(size);
  }

  // Fallback: initial badge with vibrant gradient
  const initial = (nameOrSender && nameOrSender[0]) ? nameOrSender[0].toUpperCase() : 'M';
  const colorClass = `v${fallbackIndex % 4}`;
  return `<span class="vendor ${colorClass}" style="width:${size}px; height:${size}px; border-radius:8px; display:grid; place-items:center; font-weight:800; font-size:${Math.round(size * 0.45)}px; color:#fff;">${initial}</span>`;
}
