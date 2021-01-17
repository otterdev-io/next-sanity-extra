# next-sanity-extra
This package aims to simplify integrating Next.js, and the Sanity.io CMS.
It gives you simple functions for setting up sanity, fetching static props, and using live previews as per  https://www.sanity.io/blog/live-preview-with-nextjs

## Functions

```js
import { setupNextSanity } from "@otterdev/next-sanity-extra"
```
`setupNextSanity(client: ClientConfig)` 

Returns an object with functions you can use to ease integration:

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
```js
import previewApi from "@otterdev/next-sanity-extra/api/preview"
```
`previewApi({token, data, redirect})` - API handler to call from sanity for page previews:
  - `token` - Sanity API Token
  - `data` - [optional] Function from request to preview data to return to client
  - `redirect` - [optional] Function from request to a path to redirect to. Defaults to `/${req.query.slug}`
  
## Setup
First to setup the functions, create a module, eg `lib/sanity.js`. Call `setupNextSanity(config)` to get the helper functions:

```js
import { setupNextSanity } from "@otterdev/next-sanity-extra"

// Standard sanity config
// Don't forget token for live previews
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN
};

export const {
  getClient,
  imageUrlBuilder,
  sanityStaticProps,
  useSanityQuery
 } = setupNextSanity(config);
```

## Usage
To use in a page, eg `pages/index.jsx`:

```tsx
import { sanityStaticProps, useSanityQuery } from "../lib/sanity";
import groq from "next-sanity";

const query = groq`*[ etc... ]`;

export const getStaticProps = async (context) => ({
  props: await sanityStaticProps(query, context)
});
  

export default function ServicesPage(props) {
  const { data, loading, error } = useSanityQuery(query, props);

  // Render page with data
  <h1>{data.title}</h1>
}
```

### Typescript
eg `pages/index.tsx`:
```tsx
import { sanityStaticProps, useSanityQuery } from "../lib/sanity";
import groq from "next-sanity";
import { GetStaticPropsContext } from "next";
import { SanityProps } from "@otterdev/next-sanity-extra";

const query = groq`*[ etc... ]`;

export const getStaticProps = async (context: GetStaticPropsContext) => ({
  props: sanityStaticProps(query, context)
})

// Optionally type your page's data: 
// SanityProps<{title: string, etc...}>
// Otherwise just use SanityProps
export default function ServicesPage(props: SanityProps) {
  const { data, loading, error } = useSanityQuery(query, props);

  // Render page with data
  <h1>{data.title}</h1>
}
```

## Preview API request
To serve live previews, create eg `pages/api/preview.js`.

With the default settings - forwarding to /[slug]:

```js
import previewApi from '@otterdev/next-sanity-extra/api/preview'

export default previewApi({token: process.env.SANITY_PREVIEW_TOKEN}) 
```

to forward to custom parameter - eg 'page'
```js
import previewApi from '@otterdev/next-sanity-extra/api/preview'

export default previewApi({
  token: process.env.SANITY_PREVIEW_TOKEN,
  redirect: (req) => `/${req.query.page}`
});
```