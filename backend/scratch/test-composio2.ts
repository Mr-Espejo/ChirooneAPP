async function test() {
    const composioCore = await import("composio-core");
    console.log("Keys:", Object.keys(composioCore));
    console.log("Has ComposioToolSet?", !!composioCore.ComposioToolSet);
    console.log("Has default?", !!composioCore.default);
    if (composioCore.default) console.log("Default Keys:", Object.keys(composioCore.default));
}
test();
