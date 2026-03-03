async function test() {
    try {
        const res = await fetch("http://localhost:3000/api/auth/providers");
        console.log("Providers Status:", res.status);
        console.log("Providers Body:", await res.text());

        const meRes = await fetch("http://localhost:3000/api/auth/me");
        console.log("Me Status:", meRes.status);
        console.log("Me Body:", await meRes.text());
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}
test();
