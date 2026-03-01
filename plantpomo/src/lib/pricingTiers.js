/**
 * pricingTiers.js
 *
 * Maps ISO 3166-1 alpha-2 country codes to localized pricing tiers.
 * Tiers are based on Purchasing Power Parity (PPP) to provide fair
 * pricing for users across different economies.
 *
 * Usage:
 *   import { getPricing } from "./pricingTiers";
 *   const { monthly, yearlyTotal, yearlyMonthly, symbol, currency } = getPricing("IN");
 */

export const TIERS = {
    /**
     * Tier 1 — High-income countries (USD baseline)
     * US, Canada, Australia, UK, Western Europe, Japan, South Korea, Singapore, NZ
     */
    T1: {
        currency: "USD", symbol: "$",
        monthly: 7.99, yearlyTotal: 79,
        countries: [
            "US", "CA", "AU", "GB", "NZ", "SG", "JP", "KR",
            "DE", "FR", "NL", "BE", "AT", "CH", "SE", "NO", "DK", "FI", "IE", "LU",
            "IT", "ES", "PT", "PL", "CZ", "SK", "HU", "GR", "HR",
            "IL", "AE", "SA", "QA", "KW", "BH",
        ],
    },

    /**
     * Tier 2 — Upper-middle income (Brazil, Mexico, Turkey, Malaysia, SA)
     */
    T2: {
        currency: "USD", symbol: "$",
        monthly: 3.99, yearlyTotal: 39,
        countries: [
            "BR", "MX", "TR", "MY", "TH", "ZA", "RO", "BG", "RS", "UA", "RU",
            "AR", "CL", "CO", "PE", "VE", "BO", "EC", "UY", "PY",
            "EG", "MA", "TN", "NG", "KE", "GH", "ET",
        ],
    },

    /**
     * Tier 3 — South Asia / Southeast Asia developing
     * India, Pakistan, Bangladesh, Sri Lanka, Nepal, Philippines, Indonesia, Vietnam
     */
    T3: {
        currency: "INR", symbol: "₹",
        monthly: 199, yearlyTotal: 1999,
        countries: ["IN", "LK", "NP", "BD"],
    },

    T3_PK: {
        currency: "PKR", symbol: "₨",
        monthly: 599, yearlyTotal: 5999,
        countries: ["PK"],
    },

    T3_PH: {
        currency: "PHP", symbol: "₱",
        monthly: 199, yearlyTotal: 1999,
        countries: ["PH"],
    },

    T3_ID: {
        currency: "IDR", symbol: "Rp",
        monthly: 39000, yearlyTotal: 390000,
        countries: ["ID"],
    },

    T3_VN: {
        currency: "VND", symbol: "₫",
        monthly: 99000, yearlyTotal: 990000,
        countries: ["VN"],
    },
};

/** Default = Tier 1 USD */
const DEFAULT_TIER = TIERS.T1;

/** Build lookup: country_code -> tier */
const COUNTRY_MAP = {};
Object.values(TIERS).forEach((tier) => {
    tier.countries.forEach((cc) => { COUNTRY_MAP[cc] = tier; });
});

/**
 * Returns the pricing object for a given country code.
 * Falls back to Tier 1 (USD) if the country is not mapped.
 *
 * Returned shape:
 * {
 *   currency,        // e.g. "INR"
 *   symbol,          // e.g. "₹"
 *   monthly,         // e.g. 199
 *   yearlyTotal,     // e.g. 1999
 *   yearlyMonthly,   // per-month when paid annually (rounded to 2dp)
 *   yearlySavings,   // how much saved vs monthly * 12
 * }
 */
export function getPricing(countryCode) {
    const tier = COUNTRY_MAP[countryCode?.toUpperCase?.()] ?? DEFAULT_TIER;
    const yearlyMonthly = (tier.yearlyTotal / 12);
    const yearlySavings = (tier.monthly * 12) - tier.yearlyTotal;

    // Format intelligently: IDR/VND are large numbers, avoid .00 noise
    const needsDecimals = !["IDR", "VND", "JPY", "KRW"].includes(tier.currency);

    return {
        currency: tier.currency,
        symbol: tier.symbol,
        monthly: needsDecimals ? tier.monthly.toFixed(2) : tier.monthly.toLocaleString(),
        yearlyTotal: needsDecimals ? tier.yearlyTotal.toFixed(2) : tier.yearlyTotal.toLocaleString(),
        yearlyMonthly: needsDecimals ? yearlyMonthly.toFixed(2) : Math.round(yearlyMonthly).toLocaleString(),
        yearlySavings: needsDecimals ? yearlySavings.toFixed(2) : Math.round(yearlySavings).toLocaleString(),
    };
}
