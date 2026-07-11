"use client";

import { cn } from "@/lib/utils";

/**
 * Oree brand marks — inline SVG extracted from Ben's official
 * "Copy of OREE Logo Navy V" asset (same path data as the customer
 * app's components/brand/oree-logo.tsx). One console-specific tweak:
 * the R/E/E letterforms fill with `currentColor` so the wordmark can
 * sit on the dark navy sidebar (pass `text-white`) as well as on
 * white (default navy letters). The "O" stays coral everywhere.
 */

type LogoProps = {
  className?: string;
};

const CORAL = "#ee512d";

const RING_OUTER_D =
  "M 87.234375 138.828125 C 63.246094 138.828125 43.816406 158.257812 43.816406 182.246094 C 43.816406 206.234375 63.246094 225.664062 87.234375 225.664062 C 111.222656 225.664062 130.652344 206.234375 130.652344 182.246094 C 130.652344 158.257812 111.222656 138.828125 87.234375 138.828125 Z M 87.234375 216.980469 C 68.085938 216.980469 52.5 201.390625 52.5 182.246094 C 52.5 163.097656 68.085938 147.511719 87.234375 147.511719 C 106.382812 147.511719 121.96875 163.097656 121.96875 182.246094 C 121.96875 201.390625 106.382812 216.980469 87.234375 216.980469 Z";

const RING_INNER_D =
  "M 87.234375 146.824219 C 67.667969 146.824219 51.816406 162.675781 51.816406 182.246094 C 51.816406 201.816406 67.667969 217.664062 87.234375 217.664062 C 106.804688 217.664062 122.65625 201.816406 122.65625 182.246094 C 122.65625 162.675781 106.804688 146.824219 87.234375 146.824219 Z M 87.234375 210.582031 C 71.617188 210.582031 58.898438 197.867188 58.898438 182.246094 C 58.898438 166.625 71.617188 153.910156 87.234375 153.910156 C 102.855469 153.910156 115.570312 166.625 115.570312 182.246094 C 115.570312 197.867188 102.855469 210.582031 87.234375 210.582031 Z";

const R_PATH =
  "M 49.140625 0 L 32.0625 -31.015625 L 27.265625 -31.015625 L 27.265625 0 L 7.25 0 L 7.25 -82.140625 L 40.84375 -82.140625 C 47.3125 -82.140625 52.828125 -81.007812 57.390625 -78.75 C 61.953125 -76.488281 65.363281 -73.390625 67.625 -69.453125 C 69.894531 -65.515625 71.03125 -61.125 71.03125 -56.28125 C 71.03125 -50.820312 69.488281 -45.945312 66.40625 -41.65625 C 63.320312 -37.363281 58.78125 -34.320312 52.78125 -32.53125 L 71.734375 0 Z M 27.265625 -45.171875 L 39.671875 -45.171875 C 43.335938 -45.171875 46.085938 -46.066406 47.921875 -47.859375 C 49.753906 -49.648438 50.671875 -52.1875 50.671875 -55.46875 C 50.671875 -58.582031 49.753906 -61.035156 47.921875 -62.828125 C 46.085938 -64.628906 43.335938 -65.53125 39.671875 -65.53125 L 27.265625 -65.53125 Z M 27.265625 -45.171875";

const E_PATH =
  "M 27.265625 -66.109375 L 27.265625 -49.5 L 54.0625 -49.5 L 54.0625 -34.046875 L 27.265625 -34.046875 L 27.265625 -16.03125 L 57.578125 -16.03125 L 57.578125 0 L 7.25 0 L 7.25 -82.140625 L 57.578125 -82.140625 L 57.578125 -66.109375 Z M 27.265625 -66.109375";

export function OreeMark({ className }: LogoProps) {
  return (
    <svg
      viewBox="40 135 94 94"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block text-[#ee512d]", className)}
      fill="currentColor"
      role="img"
      aria-label="Oree"
    >
      <path fillRule="evenodd" d={RING_OUTER_D} />
      <path fillRule="evenodd" d={RING_INNER_D} />
      <circle cx="113.53125" cy="183.144531" r="9.410156" />
    </svg>
  );
}

export function OreeWordmark({ className }: LogoProps) {
  return (
    <svg
      viewBox="40 135 294 95"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block text-[#0a1d35]", className)}
      role="img"
      aria-label="Oree"
    >
      <path fill={CORAL} fillRule="evenodd" d={RING_OUTER_D} />
      <path fill={CORAL} fillRule="evenodd" d={RING_INNER_D} />
      <circle cx="113.53125" cy="183.144531" r="9.410156" fill={CORAL} />
      <g fill="currentColor">
        <g transform="translate(132.468205 222.815287)">
          <path fillRule="evenodd" d={R_PATH} />
        </g>
        <g transform="translate(208.759848 222.815287)">
          <path fillRule="evenodd" d={E_PATH} />
        </g>
        <g transform="translate(272.063193 222.815287)">
          <path fillRule="evenodd" d={E_PATH} />
        </g>
      </g>
    </svg>
  );
}
