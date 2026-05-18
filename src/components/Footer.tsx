export const Footer = () => {
  return (
    <footer
      className="w-full bg-muted text-muted-foreground"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-screen-sm px-4 py-4 text-center text-xs">
        &copy; {new Date().getFullYear()}{" "}Foodies Finds &mdash; made with love for food lovers
      </div>
    </footer>
  );
}
