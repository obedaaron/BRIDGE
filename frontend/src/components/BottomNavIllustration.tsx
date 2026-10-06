export type BottomNavIconName = "home" | "explore" | "store" | "cart" | "messages" | "profile";

export function BottomNavIllustration({ name, active }: { name: BottomNavIconName; active: boolean }) {
  const colors: Record<BottomNavIconName, [string, string, string]> = {
    home: ["#62c9ff", "#287fb8", "#174d72"],
    explore: ["#b7d7e8", "#638da8", "#3b5b70"],
    store: ["#ffd36b", "#d87a42", "#8d492e"],
    cart: ["#9ce8cb", "#28a77e", "#12654e"],
    messages: ["#ffbf9a", "#e77962", "#914553"],
    profile: ["#f5c6ac", "#c881a9", "#685e99"],
  };
  const [light, front, side] = colors[name];
  return <svg aria-hidden="true" viewBox="0 0 48 48" className={"h-7 w-7 shrink-0 drop-shadow-[0_2px_2px_rgba(0,0,0,.18)] " + (active ? "" : "grayscale opacity-70")}>
    <defs>
      <linearGradient id={name + "-front"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light} /><stop offset="1" stopColor={front} /></linearGradient>
      <linearGradient id={name + "-side"} x1="0" y1="0" x2="1" y2="1"><stop stopColor={front} /><stop offset="1" stopColor={side} /></linearGradient>
    </defs>
    {name === "home" && <g stroke="#173b50" strokeLinejoin="round" strokeWidth="1.2"><ellipse cx="24" cy="42" rx="17" ry="3" fill="#11110f" opacity=".13" stroke="none" /><path d="M7 20 24 10l17 9-17 10z" fill={light} /><path d="m7 20 17 9v14L7 34z" fill={`url(#${name}-front)`} /><path d="m24 29 17-10v15l-17 9z" fill={`url(#${name}-side)`} /><path d="m7 20 17-11 17 9-17 11z" fill={light} /><path d="M19 39v-9l5-3 5 3v9z" fill="#f4d18a" /><path d="m19 30 5-3 5 3-5 3z" fill="#fff0be" /></g>}
    {name === "explore" && <g stroke="#536879" strokeLinejoin="round" strokeWidth="1.4"><circle cx="24" cy="24" r="18" fill={`url(#${name}-front)`} /><ellipse cx="24" cy="24" rx="8" ry="18" fill="none" stroke="#f4f7f7" strokeWidth="2" /><path d="M7 24h34M11 14h26M11 34h26" fill="none" stroke="#f4f7f7" strokeWidth="2" /><path d="m24 7 5 14-5-2-5 2z" fill="#fff" stroke="#708796" /><path d="m24 41-5-14 5 2 5-2z" fill="#dce9ed" stroke="#708796" /></g>}
    {name === "store" && <g stroke="#633f32" strokeLinejoin="round" strokeWidth="1.2"><ellipse cx="24" cy="42" rx="17" ry="3" fill="#11110f" opacity=".13" stroke="none" /><path d="M9 19h25v21H9z" fill={`url(#${name}-front)`} /><path d="m34 19 7-4v22l-7 3z" fill={`url(#${name}-side)`} /><path d="m8 18 4-9h24l-2 10z" fill="#ffe7b2" /><path d="m34 19 2-10 7 6-2 8z" fill={front} /><path d="M8 18h26v5H8z" fill={light} /><path d="M8 18h6v6H8zm12 0h6v6h-6zm12 0h3v6h-3z" fill="#ef9060" /><path d="M18 28h9v12h-9z" fill="#714b39" /><path d="M29 28h4v5h-4z" fill="#d8f0ee" /></g>}
    {name === "cart" && <g stroke="#285848" strokeLinejoin="round" strokeWidth="1.5"><path d="M7 10h5l4 21h22l5-16H14" fill="none" stroke="#315e51" strokeWidth="3" /><path d="m16 17 23-2-4 13H18z" fill={`url(#${name}-front)`} /><path d="m18 28 17 0-1 4H19z" fill={`url(#${name}-side)`} /><path d="M19 20v6m7-7v7m7-8v7" stroke="#e4fff3" strokeWidth="1.5" /><circle cx="21" cy="38" r="3.5" fill="#425b56" /><circle cx="35" cy="38" r="3.5" fill="#425b56" /><circle cx="21" cy="38" r="1.3" fill="#d4e9dd" stroke="none" /><circle cx="35" cy="38" r="1.3" fill="#d4e9dd" stroke="none" /></g>}
    {name === "messages" && <g stroke="#874f53" strokeLinejoin="round" strokeWidth="1.2"><path d="M7 12q0-4 5-4h20q5 0 5 5v13q0 5-5 5H20l-8 6v-6q-5-1-5-6z" fill={`url(#${name}-side)`} /><path d="M12 13h19M12 19h15M12 25h10" stroke="#fff0df" strokeLinecap="round" strokeWidth="2" /><path d="M25 24h11q5 0 5 5v8l-6-3H25q-4 0-4-4v-2" fill={light} /><circle cx="29" cy="29" r="1" fill={side} stroke="none" /><circle cx="34" cy="29" r="1" fill={side} stroke="none" /></g>}
    {name === "profile" && <g stroke="#5b5078" strokeLinejoin="round" strokeWidth="1.3"><circle cx="24" cy="24" r="19" fill="#e4e7e8" /><path d="M12 38q1-10 12-10t12 10" fill={`url(#${name}-side)`} /><path d="M17 20q0-9 7-9t7 9q0 7-7 7t-7-7" fill={`url(#${name}-front)`} /><path d="M20 19q4-4 9 0" fill="none" stroke="#fff0e9" strokeLinecap="round" strokeWidth="2" /><circle cx="21" cy="21" r="1" fill="#594b67" stroke="none" /><circle cx="27" cy="21" r="1" fill="#594b67" stroke="none" /></g>}
  </svg>;
}
