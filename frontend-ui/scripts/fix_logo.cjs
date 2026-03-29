const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\components\\Header.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\tracking\\TrackingResults.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\Register.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\onboarding\\SellingChannels.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\onboarding\\BusinessStage.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\Login.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\auth\\RegisterUser.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\auth\\ResetPassword.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\auth\\RegisterPartner.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\auth\\OrganizationSetup.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\auth\\ForgotPassword.tsx",
    "c:\\Users\\Shikhar\\Desktop\\FastFare Website\\frontend-ui\\src\\pages\\auth\\EmailVerification.tsx"
];

filesToUpdate.forEach(file => {
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace import
    if (text.includes('import logo from "@/assets/logo.png";')) {
        text = text.replace('import logo from "@/assets/logo.png";', 'import Logo from "@/components/Logo";');
        changed = true;
    }

    if (text.includes('import logo from "/logo.png";')) {
        text = text.replace('import logo from "/logo.png";', 'import Logo from "@/components/Logo";');
        changed = true;
    }

    // Custom case for Header.tsx which had the import already fixed, just needs the img tag fixed
    // and other files' img tags
    // We'll replace matching img tags
    const imgRegex = /<img[^>]*src=\{logo\}[^>]*\/>/g;
    if (imgRegex.test(text)) {
        text = text.replace(imgRegex, '<Logo size="lg" variant="full" />');
        changed = true;
    }

    // Case where it renders <img src={logo} alt="FastFare" style={{ height: '28px', width: 'auto' }} />
    // We'll just replace all <img src={logo} ... /> with the above.

    if (changed) {
        fs.writeFileSync(file, text);
        console.log(`Updated ${file}`);
    }
});

console.log('Done');
