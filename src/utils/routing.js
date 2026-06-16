export function getCurrentPath() {
  const path = window.location.hash.replace("#", "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function isActiveRoute(currentPath, routePath) {
  if (routePath === "/") {
    return currentPath === "/";
  }

  return currentPath === routePath || currentPath.startsWith(`${routePath}/`);
}
