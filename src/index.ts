import {
  createClient,
  createPreviewSubscriptionHook,
  createImageUrlBuilder,
  ClientConfig,
} from "next-sanity";
import { PicoSanity } from "picosanity";
import { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";
import { GetStaticPropsContext, GetStaticPropsResult } from "next";
import { ParsedUrlQuery } from "querystring";

export type SanityProps<T = any, Q extends ParsedUrlQuery = ParsedUrlQuery> = {
  data: T;
  preview: boolean;
  params: Q;
};

export type SanityStaticProps<
  T = any,
  P extends Record<string, unknown> = Record<string, unknown>,
  Q extends ParsedUrlQuery = ParsedUrlQuery
> = GetStaticPropsResult<SanityProps<T, Q> & P>;

export type SanityPreview<T> = {
  data: T;
  loading: boolean;
  error: Error | undefined;
};

export interface NextSanity {
  getClient: (usePreview: boolean) => PicoSanity;
  imageUrlBuilder: ImageUrlBuilder;
  sanityStaticProps: <
    T,
    P extends Record<string, unknown>,
    Q extends ParsedUrlQuery
  >(
    query: string,
    context: GetStaticPropsContext<Q>,
    staticProps?: GetStaticPropsResult<P>
  ) => Promise<SanityStaticProps<T, P, Q>>;
  useSanityPreview: <T, Q extends ParsedUrlQuery>(
    query: string,
    props: SanityProps<T, Q>
  ) => SanityPreview<T>;
}

/**
 * Create sanity client and hooks for integrating next with sanity
 */
export function setupNextSanity(config: ClientConfig): NextSanity {
  const sanityClient = createClient(config);
  const previewClient = createClient({ ...config, useCdn: false });

  const getClient = (usePreview: boolean) =>
    usePreview ? previewClient : sanityClient;

  const imageUrlBuilder = createImageUrlBuilder(config);
  const usePreviewSubscription = createPreviewSubscriptionHook(config);

  //Helper for getStaticProps to merge in all the data needed for previews
  async function sanityStaticProps<
    T,
    P extends Record<string, unknown>,
    Q extends ParsedUrlQuery
  >(
    query: string,
    context: GetStaticPropsContext<Q>,
    staticProps?: GetStaticPropsResult<P>
  ): Promise<SanityStaticProps<T, P, Q>> {
    const data = await getClient(context.preview ?? false).fetch(
      query,
      context.params ?? {}
    );
    const { props, ...rest } = (staticProps as any) ?? {};
    return {
      ...rest,
      props: {
        data,
        preview: context.preview ?? false,
        params: context.params ?? ({} as Q),
        ...(props ?? ({} as P)),
      },
    };
  }

  //Hook to return preview result from sanity
  function useSanityPreview<T, P extends ParsedUrlQuery>(
    query: string,
    props: SanityProps<T, P>
  ): {
    data: T;
    loading: boolean;
    error: Error | undefined;
  } {
    return usePreviewSubscription(query, {
      initialData: props.data,
      enabled: props.preview,
      params: props.params,
    });
  }

  return {
    getClient,
    imageUrlBuilder,
    sanityStaticProps,
    useSanityPreview,
  };
}
