package com.finance.app.config;

import java.time.Duration;
import org.ehcache.config.builders.*;
import org.ehcache.jsr107.Eh107Configuration;
import org.hibernate.cache.jcache.ConfigSettings;
import org.springframework.boot.cache.autoconfigure.JCacheManagerCustomizer;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tech.jhipster.config.JHipsterProperties;

@Configuration
@EnableCaching
public class CacheConfiguration {

    private final javax.cache.configuration.Configuration<Object, Object> jcacheConfiguration;

    public CacheConfiguration(JHipsterProperties jHipsterProperties) {
        var ehcache = jHipsterProperties.getCache().getEhcache();

        jcacheConfiguration = Eh107Configuration.fromEhcacheCacheConfiguration(
            CacheConfigurationBuilder.newCacheConfigurationBuilder(
                Object.class,
                Object.class,
                ResourcePoolsBuilder.heap(ehcache.getMaxEntries())
            )
                .withExpiry(ExpiryPolicyBuilder.timeToLiveExpiration(Duration.ofSeconds(ehcache.getTimeToLiveSeconds())))
                .build()
        );
    }

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(javax.cache.CacheManager cacheManager) {
        return hibernateProperties -> hibernateProperties.put(ConfigSettings.CACHE_MANAGER, cacheManager);
    }

    @Bean
    public JCacheManagerCustomizer cacheManagerCustomizer() {
        return cm -> {
            createCache(cm, com.finance.app.repository.UserRepository.USERS_BY_LOGIN_CACHE);
            createCache(cm, com.finance.app.repository.UserRepository.USERS_BY_EMAIL_CACHE);
            createCache(cm, com.finance.app.domain.User.class.getName());
            createCache(cm, com.finance.app.domain.Authority.class.getName());
            createCache(cm, com.finance.app.domain.User.class.getName() + ".authorities");
            createCache(cm, com.finance.app.domain.Business.class.getName());
            createCache(cm, com.finance.app.domain.Party.class.getName());
            createCache(cm, com.finance.app.domain.Account.class.getName());
            createCache(cm, com.finance.app.domain.Item.class.getName());
            createCache(cm, com.finance.app.domain.Invoice.class.getName());
            createCache(cm, com.finance.app.domain.Invoice.class.getName() + ".lineses");
            createCache(cm, com.finance.app.domain.InvoiceLine.class.getName());
            createCache(cm, com.finance.app.domain.Purchase.class.getName());
            createCache(cm, com.finance.app.domain.Purchase.class.getName() + ".lineses");
            createCache(cm, com.finance.app.domain.PurchaseLine.class.getName());
            createCache(cm, com.finance.app.domain.Payment.class.getName());
            createCache(cm, com.finance.app.domain.Payment.class.getName() + ".allocationses");
            createCache(cm, com.finance.app.domain.PaymentAllocation.class.getName());
            createCache(cm, com.finance.app.domain.ExpenseCategory.class.getName());
            createCache(cm, com.finance.app.domain.Expense.class.getName());
            createCache(cm, com.finance.app.domain.Transfer.class.getName());
            // jhipster-needle-ehcache-add-entry
        };
    }

    private void createCache(javax.cache.CacheManager cm, String cacheName) {
        javax.cache.Cache<Object, Object> cache = cm.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        } else {
            cm.createCache(cacheName, jcacheConfiguration);
        }
    }
}
