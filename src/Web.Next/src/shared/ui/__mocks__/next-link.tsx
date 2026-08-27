import type { AnchorHTMLAttributes, ReactNode } from "react";

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

function MockLink({ href, children, ...rest }: MockLinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export default MockLink;
