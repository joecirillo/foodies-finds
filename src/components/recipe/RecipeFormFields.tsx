export const SectionHeading = ({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) => (
  <h2 className="font-heading text-lg font-semibold mb-3">
    {children}
    {required && <span className="text-destructive ml-0.5">*</span>}
  </h2>
)

export const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) => (
  <label className="block text-sm font-medium text-foreground mb-1.5">
    {children}
    {required && <span className="text-destructive ml-0.5">*</span>}
  </label>
)

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null

export const textareaClass =
  "w-full min-w-0 rounded-xl border border-input bg-input/30 px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 resize-none"
