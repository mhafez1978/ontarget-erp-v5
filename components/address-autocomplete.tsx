// // "use client";

// // import { useState, useEffect, useRef } from "react";
// // import { Input } from "@/components/ui/input";
// // import { Label } from "@/components/ui/label";
// // import { MapPin, Loader2 } from "lucide-react";

// // export interface AddressData {
// //   addressLine1: string;
// //   addressLine2: string;
// //   city: string;
// //   state: string;
// //   country: string;
// //   countryCode: string;
// //   postalCode: string;
// //   latitude?: number;
// //   longitude?: number;
// // }

// // interface AddressSuggestion {
// //   [x: string]: ReactNode;
// //   properties: {
// //     name?: string;
// //     street?: string;
// //     housenumber?: string;
// //     city?: string;
// //     postcode?: string;
// //     state?: string;
// //     country?: string;
// //     countrycode?: string;
// //   };
// //   geometry: {
// //     coordinates: [number, number];
// //   };
// // }

// // interface AddressAutocompleteProps {
// //   label?: string;
// //   value: AddressData;
// //   onChange: (address: AddressData) => void;
// //   required?: boolean;
// // }

// // export function AddressAutocomplete({
// //   label = "Address",
// //   value,
// //   onChange,
// //   required = false,
// // }: AddressAutocompleteProps) {
// //   const [searchQuery, setSearchQuery] = useState("");
// //   const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
// //   const [isSearching, setIsSearching] = useState(false);
// //   const [showSuggestions, setShowSuggestions] = useState(false);
// //   const debounceTimer = useRef<NodeJS.Timeout | null>(null);
// //   const wrapperRef = useRef<HTMLDivElement>(null);

// //   // Close suggestions when clicking outside
// //   useEffect(() => {
// //     function handleClickOutside(event: MouseEvent) {
// //       if (
// //         wrapperRef.current &&
// //         !wrapperRef.current.contains(event.target as Node)
// //       ) {
// //         setShowSuggestions(false);
// //       }
// //     }
// //     document.addEventListener("mousedown", handleClickOutside);
// //     return () => document.removeEventListener("mousedown", handleClickOutside);
// //   }, []);

// //   // Search for addresses using Photon API (free, unlimited, OpenStreetMap)
// //   const searchAddress = async (query: string) => {
// //     if (!query || query.length < 3) {
// //       setSuggestions([]);
// //       return;
// //     }

// //     setIsSearching(true);
// //     try {
// //       const response = await fetch(
// //         `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
// //       );

// //       if (response.ok) {
// //         const data = await response.json();
// //         setSuggestions(data.features || []);
// //         setShowSuggestions(true);
// //       }
// //     } catch (error) {
// //       console.error("Address search error:", error);
// //     } finally {
// //       setIsSearching(false);
// //     }
// //   };

// //   // Debounce search
// //   const handleSearchChange = (query: string) => {
// //     setSearchQuery(query);

// //     if (debounceTimer.current) {
// //       clearTimeout(debounceTimer.current);
// //     }

// //     debounceTimer.current = setTimeout(() => {
// //       searchAddress(query);
// //     }, 300);
// //   };

// //   // Handle suggestion selection
// //   const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
// //     const p = suggestion.properties;

// //     const street = p.street
// //       ? `${p.housenumber || ""} ${p.street}`.trim()
// //       : p.name || "";

// //     onChange({
// //       addressLine1: street,
// //       addressLine2: "",
// //       city: p.city || "",
// //       state: p.state || "",
// //       country: p.country || "",
// //       countryCode: p.countrycode?.toUpperCase() || "",
// //       postalCode: p.postcode || "",
// //       latitude: suggestion.geometry.coordinates[1],
// //       longitude: suggestion.geometry.coordinates[0],
// //     });

// //     setSearchQuery(street);
// //     setShowSuggestions(false);
// //     setSuggestions([]);
// //   };

// //   // Get country flag emoji
// //   const getCountryFlag = (countryCode: string) => {
// //     if (!countryCode || countryCode.length !== 2) return "";
// //     const codePoints = countryCode
// //       .toUpperCase()
// //       .split("")
// //       .map((char) => 127397 + char.charCodeAt(0));
// //     return String.fromCodePoint(...codePoints);
// //   };

// //   return (
// //     <div className="space-y-4">
// //       {/* Address Search */}
// //       <div className="space-y-2" ref={wrapperRef}>
// //         <Label htmlFor="address-search">
// //           {label} {required && "*"}
// //         </Label>
// //         <div className="relative">
// //           <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
// //           <Input
// //             id="address-search"
// //             type="text"
// //             placeholder="Start typing an address..."
// //             value={searchQuery}
// //             onChange={(e) => handleSearchChange(e.target.value)}
// //             className="pl-10"
// //           />
// //           {isSearching && (
// //             <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
// //           )}
// //         </div>

// //         {/* Suggestions Dropdown */}
// //         {showSuggestions && suggestions.length > 0 && (
// //           <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
// //             <ul className="max-h-60 overflow-auto p-1">
// //               {suggestions.map((suggestion, index) => (
// //                 <li
// //                   key={index}
// //                   className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent"
// //                   onClick={() => handleSelectSuggestion(suggestion)}
// //                 >
// //                   <div className="flex items-start gap-2">
// //                     <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
// //                     <span>{suggestion.display_name}</span>
// //                   </div>
// //                 </li>
// //               ))}
// //             </ul>
// //           </div>
// //         )}
// //       </div>

// //       {/* Manual Address Fields */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //         <div className="space-y-2 md:col-span-2">
// //           <Label htmlFor="addressLine1">Street Address</Label>
// //           <Input
// //             id="addressLine1"
// //             type="text"
// //             placeholder="123 Main Street"
// //             value={value.addressLine1}
// //             onChange={(e) =>
// //               onChange({ ...value, addressLine1: e.target.value })
// //             }
// //           />
// //         </div>

// //         <div className="space-y-2 md:col-span-2">
// //           <Label htmlFor="addressLine2">Apt / Suite / Unit (Optional)</Label>
// //           <Input
// //             id="addressLine2"
// //             type="text"
// //             placeholder="Apt 4B"
// //             value={value.addressLine2}
// //             onChange={(e) =>
// //               onChange({ ...value, addressLine2: e.target.value })
// //             }
// //           />
// //         </div>

// //         <div className="space-y-2">
// //           <Label htmlFor="city">City</Label>
// //           <Input
// //             id="city"
// //             type="text"
// //             placeholder="New York"
// //             value={value.city}
// //             onChange={(e) => onChange({ ...value, city: e.target.value })}
// //           />
// //         </div>

// //         <div className="space-y-2">
// //           <Label htmlFor="state">State / Province</Label>
// //           <Input
// //             id="state"
// //             type="text"
// //             placeholder="New York"
// //             value={value.state}
// //             onChange={(e) => onChange({ ...value, state: e.target.value })}
// //           />
// //         </div>

// //         <div className="space-y-2">
// //           <Label htmlFor="country">Country</Label>
// //           <div className="flex gap-2">
// //             {value.countryCode && (
// //               <span className="text-2xl">
// //                 {getCountryFlag(value.countryCode)}
// //               </span>
// //             )}
// //             <Input
// //               id="country"
// //               type="text"
// //               placeholder="United States"
// //               value={value.country}
// //               onChange={(e) => onChange({ ...value, country: e.target.value })}
// //               className="flex-1"
// //             />
// //           </div>
// //         </div>

// //         <div className="space-y-2">
// //           <Label htmlFor="postalCode">ZIP / Postal Code</Label>
// //           <Input
// //             id="postalCode"
// //             type="text"
// //             placeholder="10001"
// //             value={value.postalCode}
// //             onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
// //           />
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// "use client";

// import { useState, useEffect, useRef } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { MapPin, Loader2 } from "lucide-react";

// export interface AddressData {
//   addressLine1: string;
//   addressLine2: string;
//   city: string;
//   state: string;
//   country: string;
//   countryCode: string;
//   postalCode: string;
//   latitude?: number;
//   longitude?: number;
// }

// interface AddressSuggestion {
//   properties: {
//     name?: string;
//     street?: string;
//     housenumber?: string;
//     city?: string;
//     postcode?: string;
//     state?: string;
//     country?: string;
//     countrycode?: string;
//   };
//   geometry: {
//     coordinates: [number, number];
//   };
// }

// interface AddressAutocompleteProps {
//   label?: string;
//   value: AddressData;
//   onChange: (address: AddressData) => void;
//   required?: boolean;
// }

// export function AddressAutocomplete({
//   label = "Address",
//   value,
//   onChange,
//   required = false,
// }: AddressAutocompleteProps) {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const debounceTimer = useRef<NodeJS.Timeout | null>(null);
//   const wrapperRef = useRef<HTMLDivElement>(null);

//   // Close suggestions when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(event.target as Node)
//       ) {
//         setShowSuggestions(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Search for addresses using Photon API
//   const searchAddress = async (query: string) => {
//     if (!query || query.length < 3) {
//       setSuggestions([]);
//       return;
//     }

//     setIsSearching(true);
//     try {
//       const response = await fetch(
//         `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
//       );

//       if (response.ok) {
//         const data = await response.json();
//         setSuggestions(data.features || []);
//         setShowSuggestions(true);
//       }
//     } catch (error) {
//       console.error("Address search error:", error);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   // Debounce search
//   const handleSearchChange = (query: string) => {
//     setSearchQuery(query);

//     if (debounceTimer.current) clearTimeout(debounceTimer.current);

//     debounceTimer.current = setTimeout(() => {
//       searchAddress(query);
//     }, 300);
//   };

//   // Handle suggestion selection
//   const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
//     const p = suggestion.properties;

//     const street = p.street
//       ? `${p.housenumber || ""} ${p.street}`.trim()
//       : p.name || "";

//     onChange({
//       addressLine1: street,
//       addressLine2: "",
//       city: p.city || "",
//       state: p.state || "",
//       country: p.country || "",
//       countryCode: p.countrycode?.toUpperCase() || "",
//       postalCode: p.postcode || "",
//       latitude: suggestion.geometry.coordinates[1],
//       longitude: suggestion.geometry.coordinates[0],
//     });

//     setSearchQuery(street);
//     setShowSuggestions(false);
//     setSuggestions([]);
//   };

//   // Country emoji
//   const getCountryFlag = (countryCode: string) => {
//     if (!countryCode || countryCode.length !== 2) return "";
//     const codePoints = countryCode
//       .toUpperCase()
//       .split("")
//       .map((char) => 127397 + char.charCodeAt(0));
//     return String.fromCodePoint(...codePoints);
//   };

//   return (
//     <div className="space-y-4">
//       {/* Address Search */}
//       <div className="space-y-2" ref={wrapperRef}>
//         <Label htmlFor="address-search">
//           {label} {required && "*"}
//         </Label>

//         <div className="relative">
//           <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

//           <Input
//             id="address-search"
//             type="text"
//             placeholder="Start typing an address..."
//             value={searchQuery}
//             onChange={(e) => handleSearchChange(e.target.value)}
//             className="pl-10"
//           />

//           {isSearching && (
//             <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
//           )}
//         </div>

//         {/* Suggestions Dropdown */}
//         {showSuggestions && suggestions.length > 0 && (
//           <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
//             <ul className="max-h-60 overflow-auto p-1">
//               {suggestions.map((suggestion, index) => (
//                 <li
//                   key={index}
//                   className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent text-foreground"
//                   onClick={() => handleSelectSuggestion(suggestion)}
//                 >
//                   <div className="flex items-start gap-2">
//                     <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />

//                     {/* SHOW TEXT SAFELY */}
//                     <span className="text-foreground">
//                       {suggestion.properties.name ||
//                         suggestion.properties.street ||
//                         "Unknown Address"}
//                     </span>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}
//       </div>

//       {/* Manual Inputs */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="space-y-2 md:col-span-2">
//           <Label htmlFor="addressLine1">Street Address</Label>
//           <Input
//             id="addressLine1"
//             type="text"
//             placeholder="123 Main Street"
//             value={value.addressLine1}
//             onChange={(e) =>
//               onChange({ ...value, addressLine1: e.target.value })
//             }
//           />
//         </div>

//         <div className="space-y-2 md:col-span-2">
//           <Label htmlFor="addressLine2">Apt / Suite / Unit (Optional)</Label>
//           <Input
//             id="addressLine2"
//             type="text"
//             placeholder="Apt 4B"
//             value={value.addressLine2}
//             onChange={(e) =>
//               onChange({ ...value, addressLine2: e.target.value })
//             }
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="city">City</Label>
//           <Input
//             id="city"
//             type="text"
//             placeholder="New York"
//             value={value.city}
//             onChange={(e) => onChange({ ...value, city: e.target.value })}
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="state">State / Province</Label>
//           <Input
//             id="state"
//             type="text"
//             placeholder="New York"
//             value={value.state}
//             onChange={(e) => onChange({ ...value, state: e.target.value })}
//           />
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="country">Country</Label>
//           <div className="flex gap-2">
//             {value.countryCode && (
//               <span className="text-2xl">
//                 {getCountryFlag(value.countryCode)}
//               </span>
//             )}
//             <Input
//               id="country"
//               type="text"
//               placeholder="United States"
//               value={value.country}
//               onChange={(e) => onChange({ ...value, country: e.target.value })}
//               className="flex-1"
//             />
//           </div>
//         </div>

//         <div className="space-y-2">
//           <Label htmlFor="postalCode">ZIP / Postal Code</Label>
//           <Input
//             id="postalCode"
//             type="text"
//             placeholder="10001"
//             value={value.postalCode}
//             onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";

export interface AddressData {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

interface AddressSuggestion {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    postcode?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface AddressAutocompleteProps {
  label?: string;
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
}

export function AddressAutocomplete({
  label = "Address",
  value,
  onChange,
  required = false,
}: AddressAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for addresses using your internal API (which proxies to Photon)
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    console.log("🔍 Searching for address:", query);
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(query)}&limit=5`
      );

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Response data:", data);
        console.log("📍 Features count:", data.features?.length || 0);
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } else {
        console.error(
          "❌ Response not OK:",
          response.status,
          response.statusText
        );
        const errorData = await response.json().catch(() => null);
        console.error("Error data:", errorData);
      }
    } catch (error) {
      console.error("❌ Address search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      searchAddress(query);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const p = suggestion.properties;

    const street = p.street
      ? `${p.housenumber || ""} ${p.street}`.trim()
      : p.name || "";

    const newAddress = {
      addressLine1: street,
      addressLine2: "",
      city: p.city || "",
      state: p.state || "",
      country: p.country || "",
      countryCode: p.countrycode?.toUpperCase() || "",
      postalCode: p.postcode || "",
      latitude: suggestion.geometry.coordinates[1],
      longitude: suggestion.geometry.coordinates[0],
    };

    // Safely call onChange with validation
    if (typeof onChange === "function") {
      onChange(newAddress);
    } else {
      console.error(
        "[AddressAutocomplete] onChange is not a function",
        onChange
      );
    }

    setSearchQuery(street);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Country emoji flag
  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode.length !== 2) return "";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Ensure value is defined with defaults
  const safeValue = value || {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "United States",
    countryCode: "US",
    postalCode: "",
  };

  return (
    <div className="space-y-4">
      {/* Address Search */}
      <div className="space-y-2 relative" ref={wrapperRef}>
        <Label htmlFor="address-search">
          {label} {required && "*"}
        </Label>

        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            id="address-search"
            type="text"
            placeholder="Start typing an address..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />

          {isSearching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg top-full left-0">
              <ul 
                className="max-h-60 overflow-auto p-1"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {suggestions.map((suggestion, index) => {
                  const p = suggestion.properties;
                  const flag = p.countrycode
                    ? getCountryFlag(p.countrycode)
                    : "";

                  const line1 = `${p.housenumber ? p.housenumber + " " : ""}${
                    p.street || p.name || "Unknown Address"
                  }`.trim();

                  const line2 = [p.city, p.state, p.country]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <li
                      key={index}
                      className="cursor-pointer rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />

                        <div className="flex flex-col">
                          {/* Main Row */}
                          <div className="flex items-center gap-2">
                            {flag && <span className="text-lg">{flag}</span>}
                            <span className="font-medium text-foreground">
                              {line1}
                            </span>
                          </div>

                          {/* Subline */}
                          <span className="text-xs text-muted-foreground ml-7">
                            {line2}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Manual Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addressLine1">Street Address</Label>
          <Input
            id="addressLine1"
            type="text"
            placeholder="123 Main Street"
            value={safeValue.addressLine1}
            onChange={(e) => {
              if (typeof onChange === "function") {
                onChange({ ...safeValue, addressLine1: e.target.value });
              }
            }}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addressLine2">Apt / Suite / Unit (Optional)</Label>
          <Input
            id="addressLine2"
            type="text"
            placeholder="Apt 4B"
            value={safeValue.addressLine2}
            onChange={(e) => {
              if (typeof onChange === "function") {
                onChange({ ...safeValue, addressLine2: e.target.value });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            type="text"
            placeholder="New York"
            value={safeValue.city}
            onChange={(e) => {
              if (typeof onChange === "function") {
                onChange({ ...safeValue, city: e.target.value });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State / Province</Label>
          <Input
            id="state"
            type="text"
            placeholder="New York"
            value={safeValue.state}
            onChange={(e) => {
              if (typeof onChange === "function") {
                onChange({ ...safeValue, state: e.target.value });
              }
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <div className="relative">
            {safeValue.countryCode && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none">
                {getCountryFlag(safeValue.countryCode)}
              </span>
            )}
            <Input
              id="country"
              type="text"
              placeholder="United States"
              value={safeValue.country}
              onChange={(e) => {
                if (typeof onChange === "function") {
                  onChange({ ...safeValue, country: e.target.value });
                }
              }}
              className={safeValue.countryCode ? "pl-12" : ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">ZIP / Postal Code</Label>
          <Input
            id="postalCode"
            type="text"
            placeholder="10001"
            value={safeValue.postalCode}
            onChange={(e) => {
              if (typeof onChange === "function") {
                onChange({ ...safeValue, postalCode: e.target.value });
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
