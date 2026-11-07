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
  `
};

/**
 * Determine and render the authentic email provider logo on the basis of the mailbox name or email address.
 * E.g. Gmail for Google/Gmail, Outlook for Microsoft, iCloud for Apple, etc.
 * 
 * @param {string} emailOrName
 * @param {number} [size=28]
 * @returns {string} SVG HTML string
 */
export function getMailboxLogo(emailOrName = '', size = 28, isGoogle = false) {
  const str = String(emailOrName).toLowerCase();

  if (isGoogle || str.includes('gmail') || str.includes('google') || str.endsWith('@googlemail.com')) {
    return providerLogos.gmail(size);
  }
  if (str.includes('outlook') || str.includes('hotmail') || str.includes('live.com') || str.includes('microsoft') || str.includes('office') || str.includes('msn.com')) {
    return providerLogos.outlook(size);
  }
  if (str.includes('icloud') || str.includes('me.com') || str.includes('mac.com') || str.includes('apple')) {
    return providerLogos.icloud(size);
  }
  if (str.includes('yahoo') || str.includes('ymail.com')) {
    return providerLogos.yahoo(size);
  }
  if (str.includes('proton') || str.includes('pm.me')) {
    return providerLogos.proton(size);
  }
  if (str.includes('fastmail')) {
    return providerLogos.fastmail(size);
  }

  // Fallback: Default to Gmail if it's the standard Mailgrant default or sample workspace
  if (str.includes('mailgrant') || str.includes('personal') || str.includes('sample') || str.includes('work')) {
    return providerLogos.gmail(size);
  }

  return providerLogos.custom(size);
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
  if (str.includes('google') || str.includes('gmail')) {
    return companyLogos.google(size);
  }
  if (str.includes('outlook') || str.includes('microsoft')) {
    return providerLogos.outlook(size);
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

  // Fallback: initial badge with vibrant gradient
  const initial = (nameOrSender && nameOrSender[0]) ? nameOrSender[0].toUpperCase() : 'M';
  const colorClass = `v${fallbackIndex % 4}`;
  return `<span class="vendor ${colorClass}" style="width:${size}px; height:${size}px; border-radius:8px; display:grid; place-items:center; font-weight:800; font-size:${Math.round(size * 0.45)}px; color:#fff;">${initial}</span>`;
}
