<template>
  <div>
    <div class="min-h-screen flex">
      <div
        class="
          relative
          overflow-hidden
          flex
          w-full
          bg-gradient-to-tr
          from-blue-800
          to-purple-700
          items-start
          pt-20
          md:pt-0
          justify-around
          md:items-center
        "
      >
        <div class="container mx-auto md:py-12">
          <div class="text-center flex flex-col items-center justify-center">
            <h1 class="text-white font-bold text-6xl font-sans">
              Appwrite Live Demo
            </h1>
            <p class="text-white mt-1 text-2xl max-w-2xl py-10">
              Try out Appwrite with 1 click! We will setup project and admin
              account for you that will work for 60 minutes.
            </p>
            <button
              v-if="!isCreated"
              @click="onStartInstance()"
              type="submit"
              class="
                block
                px-4
                bg-white
                text-indigo-800
                mt-4
                py-2
                rounded-2xl
                font-bold
                mb-2
                text-xl
              "
            >
              <span v-if="!isLoading"> Try Appwrite Now</span>

              <svg
                v-if="isLoading"
                class="w-7 h-7 animate-spin text-indigo-800"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </button>

            <div
              v-if="isCreated"
              class="flex flex-col items-center space-y-10 mt-20"
            >
              <p class="text-white font-semibold text-3xl max-w-3xl">
                There you go, everything is ready... Mark down these
                credentials! Enjoy your very own Appwrite for 60 minutes.
              </p>

              <div>
                <div class="flex items-center justify-center space-x-3">
                  <p class="text-2xl font-bold text-white">Email:</p>
                  <div class="rounded-lg bg-white text-indigo-800 py-2 px-4">
                    {{ email }}
                  </div>
                </div>

                <div class="flex items-center justify-center space-x-3">
                  <p class="text-2xl font-bold text-white">Project name:</p>
                  <div class="rounded-lg bg-white text-indigo-800 py-2 px-4">
                    {{ projectName }}
                  </div>
                </div>

                <div class="mt-4 flex items-center justify-center space-x-3">
                  <p class="text-2xl font-bold text-white">Password:</p>
                  <div class="rounded-lg bg-white text-indigo-800 py-2 px-4">
                    {{ password }}
                  </div>
                </div>
              </div>
              <a href="https://aw.matejbaco.eu/auth/signin">
                <button
                  type="button"
                  class="
                    block
                    px-4
                    bg-white
                    text-indigo-800
                    mt-4
                    py-2
                    rounded-2xl
                    font-bold
                    mb-2
                    text-xl
                  "
                >
                  Go to Appwrite Console
                </button>
              </a>
            </div>
          </div>
          <div
            class="
              absolute
              -bottom-32
              -left-40
              w-80
              h-80
              border-4
              rounded-full
              border-opacity-30 border-t-8
            "
          ></div>
          <div
            class="
              absolute
              -bottom-40
              -left-20
              w-80
              h-80
              border-4
              rounded-full
              border-opacity-30 border-t-8
            "
          ></div>
          <div
            class="
              absolute
              -top-40
              -right-0
              w-80
              h-80
              border-4
              rounded-full
              border-opacity-30 border-t-8
            "
          ></div>
          <div
            class="
              absolute
              -top-20
              -right-20
              w-80
              h-80
              border-4
              rounded-full
              border-opacity-30 border-t-8
            "
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  data: function () {
    return {
      isLoading: false,
      isCreated: false,
      email: "",
      password: "",
      projectName: "",
    };
  },
  methods: {
    async onStartInstance() {
      if (this.isLoading) {
        return;
      }

      this.isLoading = true;
      const instance = await this.$axios.$post(
        "https://aw.matejbaco.eu/v1/customapi/instances"
      );
      console.log(instance);

      this.email = instance.data.userEmail;
      this.password = instance.data.password;
      this.projectName = instance.data.projectName;

      this.isLoading = false;
      this.isCreated = true;
    },
  },
});
</script>
