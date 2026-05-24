# TanStack Start + shadcn/ui

This is a template for a new TanStack Start project with React, TypeScript, and shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## ImageKit uploads

The profile page now supports uploading a new avatar through ImageKit.

Add these environment variables:

```bash
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
```

`IMAGEKIT_PRIVATE_KEY` is only used on the server to generate upload signatures.
`IMAGEKIT_PUBLIC_KEY` is returned to the client when creating upload auth params.
