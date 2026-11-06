# frozen_string_literal: true

# Remove the Atom feed page shipped by the Chirpy theme (assets/feed.xml),
# so that /feed.xml is no longer generated.
Jekyll::Hooks.register :site, :post_read do |site|
  site.pages.reject! do |page|
    page.respond_to?(:url) && page.url == "/feed.xml"
  end
end
