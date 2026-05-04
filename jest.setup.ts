if (typeof global.btoa !== "function") {
  global.btoa = (value: string) => Buffer.from(value, "binary").toString("base64");
}

if (typeof global.atob !== "function") {
  global.atob = (value: string) => Buffer.from(value, "base64").toString("binary");
}
