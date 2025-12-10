import React, { useCallback } from 'react';
import VisualizeDBLogo from '@/assets/logo-light.png';
import VisualizeDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { DiagramName } from './diagram-name';
import { LastSaved } from './last-saved';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { effectiveTheme } = useTheme();

    const renderStars = useCallback(() => {
        return (
            <iframe
                src={`https://ghbtns.com/github-btn.html?user=visualizedb&repo=visualizedb&type=star&size=large&text=false`}
                width="40"
                height="30"
                title="GitHub"
            ></iframe>
        );
    }, []);

    return (
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-[10px]">
                    <a
                        href="https://visualizedb.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? VisualizeDBLogo
                                    : VisualizeDBDarkLogo
                            }
                            alt="visualizeDB"
                            className="h-4 max-w-fit"
                        />
                    </a>
                </div>
                <Menu />
            </div>
            <DiagramName />
            <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
                <LastSaved />
                {renderStars()}
                <LanguageNav />
            </div>
        </nav>
    );
};
