# next-sanity-extra
This package aims to simplify integrating Next.js, and the Sanity.io CMS.
It gives you simple functions for setting up sanity, fetching static props, and using live previews as per  https://www.sanity.io/blog/live-preview-with-nextjs

## Functions

```js
import { setupNextSanity } from "@otterdev/next-sanity-extra"
```
`setupNextSanity(client: ClientConfig, serializers?: PortableTextSerializers)` 

Returns an object with functions you can use to ease integration:

- `sanityClient('anonymous' | 'authenticated' | 'preview')` - A sanity client with a given setup. Token must be set in order to use authenticated or preview
- `imageUrlBuilder` - A ImageUrlBuilder
- `PortableText` - Portable Text component
- `sanityStaticProps({context, query, queryParams, authenticated})` - Returns static props for getStaticProps.
  - `context` - the context passed into getStaticProps
  - `query` - the query to run for the page.
  - `queryParams` - [optional] params to substitute into the query. If not provided, will be taken from context.params. 
  - `authenticated` - [optional] whether to use an authenticated sanity client, if you have provided token to config. Defaults to false.
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
// Don't forget token, to get a preview client and authenticated client
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN
};

export const {
  sanityClient,
  imageUrlBuilder,
  PortableText,
  sanityStaticProps,
  useSanityQuery
 } = setupNextSanity(config);
```

## Usage
To use in a page, eg `pages/index.jsx`:

```tsx
import { sanityStaticProps, useSanityQuery, PortableText } from "../lib/sanity";
import groq from "next-sanity";

const myQuery = groq`*[ etc... ]`;

export const getStaticProps = async (context) => ({
  props: await sanityStaticProps({context, query: myQuery})
});
  

export default function ServicesPage(props) {
  const { data, loading, error } = useSanityQuery(query, props);

  // Render page with data
  <h1>{data.title}</h1>
  <PortableText blocks={data.content} />
}
```

### Typescript
eg `pages/index.tsx`:
```tsx
import { sanityStaticProps, useSanityQuery, PortableText } from "../lib/sanity";
import groq from "next-sanity";
import { GetStaticPropsContext } from "next";
import { SanityProps } from "@otterdev/next-sanity-extra";

const myQuery = groq`*[ etc... ]`;

export const getStaticProps = async (context: GetStaticPropsContext) => ({
  props: sanityStaticProps({context, query: myQuery})
})

// Optionally type your page's data: 
// SanityProps<{title: string, etc...}>
// Otherwise just use SanityProps
export default function ServicesPage(props: SanityProps) {
  const { data, loading, error } = useSanityQuery(query, props);

  // Render page with data
  <h1>{data.title}</h1>
  <PortableText blocks={data.content} />
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