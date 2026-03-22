import Link from "next/link";

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
    return (
        <p className="text-sm text-center text-muted-foreground">
            {text}{" "}
            <Link href={href} className="font-medium text-primary hover:underline">
                {linkText}
            </Link>
        </p>
    );
};

export default FooterLink;
