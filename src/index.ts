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

export type SanityPreview<T> = {
  data: T;
  loading: boolean;
  error: Error | undefined;
};

export interface NextSanity {
  getClient: (usePreview: boolean) => PicoSanity;
  imageUrlBuilder: ImageUrlBuilder;
  sanityStaticProps: <T, Q extends ParsedUrlQuery>(
    query: string,
    context: GetStaticPropsContext<Q>,
    params?: Q 
  ) => Promise<SanityProps<T, Q>>;
  useSanityQuery: <T, Q extends ParsedUrlQuery>(
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

  /**
   * Helper for getStaticProps to return result from sanity query
   */
  async function sanityStaticProps<T extends any, Q extends ParsedUrlQuery>(
    query: string,
    context: GetStaticPropsContext<Q>,
    params?: Q
  ): Promise<SanityProps<T, Q>> {
    const rParams = params ?? context.params ?? ({} as Q);
    const data = await getClient(context.preview ?? false).fetch(query, rParams);
    return {
      data,
      preview: context.preview ?? false,
      params: rParams,
    };
  }

  /**
   * Hook to return sanity data with preview, or not
   */
  function useSanityQuery<T, Q extends ParsedUrlQuery>(
    query: string,
    props: SanityProps<T, Q>,
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
    useSanityQuery,
  };
}
