export function getCurrentPath() {
  const hashPath = window.location.hash.replace("#", "") || "/";
  const path = hashPath.split("?")[0] || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function isActiveRoute(currentPath, routePath) {
  if (routePath === "/") {
    return currentPath === "/";
  }

  return currentPath === routePath || currentPath.startsWith(`${routePath}/`);
}
