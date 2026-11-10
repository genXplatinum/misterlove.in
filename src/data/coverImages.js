export const coverWidths = [320, 480, 720, 1080];

export function coverImageProps(book, sizes) {
  const base = `/book-covers/responsive/${book.id}`;
  return {
    src: `${base}-720.webp`,
    srcSet: coverWidths.map(width => `${base}-${width}.webp ${width}w`).join(', '),
    sizes,
  };
}
