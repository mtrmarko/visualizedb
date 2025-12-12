import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip/tooltip';
import type { DatabaseEdition } from '@visualizedb/shared';
import { databaseEditionToLabelMap } from '@visualizedb/shared';
import { databaseEditionToImageMap } from '@/config/database-edition-images';
import {
    databaseSecondaryLogoMap,
    databaseTypeToLabelMap,
} from '@/lib/databases';
import type { DatabaseType } from '@visualizedb/shared';
import { cn } from '@/lib/utils';

export interface DiagramIconProps extends React.ComponentPropsWithoutRef<'div'> {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    imgClassName?: string;
}

export const DiagramIcon = React.forwardRef<
    React.ElementRef<typeof TooltipTrigger>,
    DiagramIconProps
>(({ databaseType, databaseEdition, className, imgClassName, onClick }, ref) =>
    databaseEdition ? (
        <Tooltip>
            <TooltipTrigger className={cn('mr-1', className)} ref={ref} asChild>
                <img
                    src={databaseEditionToImageMap[databaseEdition]}
                    className={cn('max-h-5 max-w-5 rounded-full', imgClassName)}
                    alt="database"
                    onClick={onClick}
                />
            </TooltipTrigger>
            <TooltipContent>
                {databaseEditionToLabelMap[databaseEdition]}
            </TooltipContent>
        </Tooltip>
    ) : (
        <Tooltip>
            <TooltipTrigger className={cn('mr-2', className)} ref={ref} asChild>
                <img
                    src={databaseSecondaryLogoMap[databaseType]}
                    className={cn('max-h-5 max-w-5', imgClassName)}
                    alt="database"
                    onClick={onClick}
                />
            </TooltipTrigger>
            <TooltipContent>
                {databaseTypeToLabelMap[databaseType]}
            </TooltipContent>
        </Tooltip>
    )
);

DiagramIcon.displayName = 'DiagramIcon';
