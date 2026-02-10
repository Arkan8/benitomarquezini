export function tienePermiso(tags) {
  return (
    tags.badges?.vip === "1" ||
    tags.mod ||
    tags.badges?.broadcaster === "1"
  );
}
