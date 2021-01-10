# next-sanity-extra
This package provides functions, hooks and types to simplify and reduce the boilerplate when integrating Next.js as a SSG, with Sanity.io CMS, with live previews, as per  https://www.sanity.io/blog/live-preview-with-nextjs

## Functions
`setupNextSanity(client: ClientConfig)` - Returns an object with functions you can use to ease integration:

### Client Functions
- `getClient(preview)` - A Sanity client that uses preview data or not
- `imageUrlBuilder` - A ImageUrlBuilder
- `sanityStaticProps(query, context, staticProps)` - Returns static props for getStaticProps.
  - `query` - the query to run for the page.
  - `context` - the context passed into getStaticProps
  - `staticProps` - [optional] extra settings to pass to getStaticProps. If it contains `props`, it will be merged with the sanity data.
- `useSanityPreview(query, props)` - A hook which returns preview-enabled data for use in each page.
  - `query` - the query to run for the page
  - `props` - props passed into the page component

### API Funcions
- `previewApi` - API handler to call from sanity for page previews

## Setup
First to setup the functions, create a module, eg `lib/sanity.ts`. Call `setupNextSanity(config)` to get the helper functions:

```ts
import { setupNextSanity } from "@otterdev/next-sanity-extra"

// Standard sanity config
// Don't forget token for live previews
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN
};

export const {
  getClient,
  imageUrlBuilder,
  sanityStaticProps,
  useSanityPreview
 } = setupNextSanity(config);
```

## Usage
To use in a page, eg `pages/index.tsx`:

```tsx
import { sanityStaticProps, useSanityPreview } from "../lib/sanity";
// Don't need these type imports in js
import { GetStaticPropsContext } from "next";
import { SanityProps, SanityStaticProps } from "@otterdev/next-sanity-extra";

const query = groq`*[ etc... ]`;

export const getStaticProps = async (
  context: GetStaticPropsContext
): Promise<SanityStaticProps> =>
  sanityStaticProps(query, context, { revalidate: 60 });

// Optionally type your page's data: 
// SanityProps<{title: string, etc...}>
// Otherwise just use SanityProps
export default function ServicesPage(props: SanityProps) {
  const { data, loading, error } = useSanityPreview(query, props);

  // Render page with data
  <h1>{data.title}</h1>
}
```

## Preview API request
To serve live previews, create eg `pages/api/preview.ts`:

```ts
import previewApi from '@otterdev/next-sanity-extra/api/preview'

export default previewApi(process.env.SANITY_PREVIEW_TOKEN!) 
```