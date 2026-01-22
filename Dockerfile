FROM node:slim

# Set working directory
WORKDIR /restapi

# copy the source code to the working directory
COPY ./ /restapi

# install the dependencies
RUN npm install

# Install prisma platform deps
RUN apt-get update -y && apt-get install -y openssl

# generate prisma client
RUN npx prisma generate

# start the application
EXPOSE 3000
CMD ["yarn", "start:dev"]