import { ApolloClient, HttpLink, InMemoryCache } from "apollo-boost";
import { loginAnonymous } from "./authentication";

// url to connect to graphql
const graphql_url = `<YOUR GRAPHQL URL>`;
const httpLink = new HttpLink({ uri: graphql_url });

const authorizationHeaderLink = loginAnonymous();

// TODO: Initialize an Apollo Client
const client =

export { client };
