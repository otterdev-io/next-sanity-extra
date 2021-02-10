import {
  createClient,
  createPreviewSubscriptionHook,
  createImageUrlBuilder,
  ClientConfig,
  createPortableTextComponent,
} from "next-sanity";
import { PicoSanity } from "picosanity";
import { ImageUrlBuilder } from "@sanity/image-url/lib/types/builder";
import { GetStaticPropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import {
  PortableTextProps,
  PortableTextSerializers,
} from "@sanity/block-content-to-react";

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

export type SanityStaticPropsArgs<Q extends ParsedUrlQuery> = {
  context: GetStaticPropsContext<Q>;
  query: string;
  params?: Q;
  authenticated?: boolean;
};

export type SanityClientType = "anonymous" | "authenticated" | "preview";
export interface NextSanity {
  sanityClient(type: SanityClientType): PicoSanity;
  imageUrlBuilder: ImageUrlBuilder;
  PortableText: (props: PortableTextProps) => JSX.Element;
  sanityStaticProps: <T, Q extends ParsedUrlQuery>({
    context,
    query,
    params,
    authenticated,
  }: SanityStaticPropsArgs<Q>) => Promise<SanityProps<T, Q>>;
  useSanityQuery: <T, Q extends ParsedUrlQuery>(
    query: string,
    props: SanityProps<T, Q>
  ) => SanityPreview<T>;
}

/**
 * Create sanity client and hooks for integrating next with sanity
 */
export function setupNextSanity(
  config: ClientConfig,
  serializers?: PortableTextSerializers
): NextSanity {
  const sanityClient = (type: SanityClientType) => {
    switch (type) {
      case "anonymous":
        return createClient({ ...config, token: undefined });
      case "authenticated":
        if (!config.token) {
          throw new Error(
            "Couldnt create authenticated client because Sanity API token is not set"
          );
        }
        return createClient({ ...config });
      case "preview":
        if (!config.token) {
          throw new Error(
            "Couldnt create preview client because Sanity API token is not set"
          );
        }
        return createClient({ ...config, useCdn: false });
    }
  };

  const imageUrlBuilder = createImageUrlBuilder(config);
  const usePreviewSubscription = createPreviewSubscriptionHook(config);
  const PortableText = createPortableTextComponent({ ...config, serializers });

  /**
   * Helper for getStaticProps to return result from sanity query
   */
  async function sanityStaticProps<T extends any, Q extends ParsedUrlQuery>({
    context,
    query,
    params,
    authenticated,
  }: SanityStaticPropsArgs<Q>): Promise<SanityProps<T, Q>> {
    const rParams = params ?? context.params ?? ({} as Q);
    const client = sanityClient(
      context.preview
        ? "preview"
        : authenticated
        ? "authenticated"
        : "anonymous"
    );
    const data = await client.fetch(query, rParams);
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
    props: SanityProps<T, Q>
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
    sanityClient,
    imageUrlBuilder,
    PortableText,
    sanityStaticProps,
    useSanityQuery,
  };
}
