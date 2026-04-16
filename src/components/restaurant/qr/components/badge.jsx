const Badge = ({ children, variant = "info", ...props }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    info: "bg-indigo-50 text-indigo-700 border-indigo-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        styles[variant]
      } ${props.className || ""}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
