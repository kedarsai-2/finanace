package com.finance.app.config;

import static org.springframework.security.config.Customizer.withDefaults;

import com.finance.app.security.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import tech.jhipster.config.JHipsterProperties;

@Configuration
@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfiguration {

    private final JHipsterProperties jHipsterProperties;

    public SecurityConfiguration(JHipsterProperties jHipsterProperties) {
        this.jHipsterProperties = jHipsterProperties;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .cors(withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz ->
                // prettier-ignore
                authz
                    .requestMatchers(HttpMethod.POST, "/api/authenticate").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/authenticate").permitAll()
                    .requestMatchers("/api/register").permitAll()
                    .requestMatchers("/api/activate").permitAll()
                    .requestMatchers("/api/account/reset-password/init").permitAll()
                    .requestMatchers("/api/account/reset-password/finish").permitAll()
                    .requestMatchers("/api/admin/**").hasAuthority(AuthoritiesConstants.ADMIN)
                    .requestMatchers(HttpMethod.GET, "/api/businesses/**").hasAnyAuthority(moduleReadAuthorities("BUSINESSES"))
                    .requestMatchers(HttpMethod.POST, "/api/businesses/**").hasAnyAuthority(moduleWriteAuthorities("BUSINESSES"))
                    .requestMatchers(HttpMethod.PUT, "/api/businesses/**").hasAnyAuthority(moduleEditAuthorities("BUSINESSES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/businesses/**").hasAnyAuthority(moduleEditAuthorities("BUSINESSES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/businesses/**").hasAnyAuthority(moduleDeleteAuthorities("BUSINESSES"))
                    .requestMatchers(HttpMethod.GET, "/api/parties/**").hasAnyAuthority(moduleReadAuthorities("PARTIES"))
                    .requestMatchers(HttpMethod.POST, "/api/parties/**").hasAnyAuthority(moduleWriteAuthorities("PARTIES"))
                    .requestMatchers(HttpMethod.PUT, "/api/parties/**").hasAnyAuthority(moduleEditAuthorities("PARTIES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/parties/**").hasAnyAuthority(moduleEditAuthorities("PARTIES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/parties/**").hasAnyAuthority(moduleDeleteAuthorities("PARTIES"))
                    .requestMatchers(HttpMethod.GET, "/api/items/**").hasAnyAuthority(moduleReadAuthorities("ITEMS"))
                    .requestMatchers(HttpMethod.POST, "/api/items/**").hasAnyAuthority(moduleWriteAuthorities("ITEMS"))
                    .requestMatchers(HttpMethod.PUT, "/api/items/**").hasAnyAuthority(moduleEditAuthorities("ITEMS"))
                    .requestMatchers(HttpMethod.PATCH, "/api/items/**").hasAnyAuthority(moduleEditAuthorities("ITEMS"))
                    .requestMatchers(HttpMethod.DELETE, "/api/items/**").hasAnyAuthority(moduleDeleteAuthorities("ITEMS"))
                    .requestMatchers(HttpMethod.GET, "/api/invoices/**").hasAnyAuthority(moduleReadAuthorities("SALES"))
                    .requestMatchers(HttpMethod.POST, "/api/invoices/**").hasAnyAuthority(moduleWriteAuthorities("SALES"))
                    .requestMatchers(HttpMethod.PUT, "/api/invoices/**").hasAnyAuthority(moduleEditAuthorities("SALES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/invoices/**").hasAnyAuthority(moduleEditAuthorities("SALES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/invoices/**").hasAnyAuthority(moduleDeleteAuthorities("SALES"))
                    .requestMatchers(HttpMethod.GET, "/api/invoice-lines/**").hasAnyAuthority(moduleReadAuthorities("SALES"))
                    .requestMatchers(HttpMethod.POST, "/api/invoice-lines/**").hasAnyAuthority(moduleWriteAuthorities("SALES"))
                    .requestMatchers(HttpMethod.PUT, "/api/invoice-lines/**").hasAnyAuthority(moduleEditAuthorities("SALES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/invoice-lines/**").hasAnyAuthority(moduleEditAuthorities("SALES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/invoice-lines/**").hasAnyAuthority(moduleDeleteAuthorities("SALES"))
                    .requestMatchers(HttpMethod.GET, "/api/purchases/**").hasAnyAuthority(moduleReadAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.POST, "/api/purchases/**").hasAnyAuthority(moduleWriteAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.PUT, "/api/purchases/**").hasAnyAuthority(moduleEditAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/purchases/**").hasAnyAuthority(moduleEditAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/purchases/**").hasAnyAuthority(moduleDeleteAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.GET, "/api/purchase-lines/**").hasAnyAuthority(moduleReadAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.POST, "/api/purchase-lines/**").hasAnyAuthority(moduleWriteAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.PUT, "/api/purchase-lines/**").hasAnyAuthority(moduleEditAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/purchase-lines/**").hasAnyAuthority(moduleEditAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/purchase-lines/**").hasAnyAuthority(moduleDeleteAuthorities("PURCHASES"))
                    .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyAuthority(moduleReadAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAnyAuthority(moduleWriteAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.PUT, "/api/payments/**").hasAnyAuthority(moduleEditAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.PATCH, "/api/payments/**").hasAnyAuthority(moduleEditAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.DELETE, "/api/payments/**").hasAnyAuthority(moduleDeleteAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.GET, "/api/payment-allocations/**").hasAnyAuthority(moduleReadAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.POST, "/api/payment-allocations/**").hasAnyAuthority(moduleWriteAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.PUT, "/api/payment-allocations/**").hasAnyAuthority(moduleEditAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.PATCH, "/api/payment-allocations/**").hasAnyAuthority(moduleEditAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.DELETE, "/api/payment-allocations/**").hasAnyAuthority(moduleDeleteAuthorities("PAYMENTS"))
                    .requestMatchers(HttpMethod.GET, "/api/accounts/**").hasAnyAuthority(moduleReadAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.POST, "/api/accounts/**").hasAnyAuthority(moduleWriteAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.PUT, "/api/accounts/**").hasAnyAuthority(moduleEditAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.PATCH, "/api/accounts/**").hasAnyAuthority(moduleEditAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.DELETE, "/api/accounts/**").hasAnyAuthority(moduleDeleteAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.GET, "/api/transfers/**").hasAnyAuthority(moduleReadAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.POST, "/api/transfers/**").hasAnyAuthority(moduleWriteAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.PUT, "/api/transfers/**").hasAnyAuthority(moduleEditAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.PATCH, "/api/transfers/**").hasAnyAuthority(moduleEditAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.DELETE, "/api/transfers/**").hasAnyAuthority(moduleDeleteAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.GET, "/api/cash-balance/**").hasAnyAuthority(moduleReadAuthorities("ACCOUNTS"))
                    .requestMatchers(HttpMethod.GET, "/api/expenses/**").hasAnyAuthority(moduleReadAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.POST, "/api/expenses/**").hasAnyAuthority(moduleWriteAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.PUT, "/api/expenses/**").hasAnyAuthority(moduleEditAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/expenses/**").hasAnyAuthority(moduleEditAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/expenses/**").hasAnyAuthority(moduleDeleteAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.GET, "/api/expense-categories/**").hasAnyAuthority(moduleReadAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.POST, "/api/expense-categories/**").hasAnyAuthority(moduleWriteAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.PUT, "/api/expense-categories/**").hasAnyAuthority(moduleEditAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.PATCH, "/api/expense-categories/**").hasAnyAuthority(moduleEditAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.DELETE, "/api/expense-categories/**").hasAnyAuthority(moduleDeleteAuthorities("EXPENSES"))
                    .requestMatchers(HttpMethod.POST, "/api/cloudinary/**").hasAnyAuthority(
                        moduleWriteAuthorities("SALES")
                    )
                    .requestMatchers("/api/**").authenticated()
                    // Swagger / OpenAPI (enabled only with the api-docs profile in this app)
                    .requestMatchers("/swagger-ui.html").permitAll()
                    .requestMatchers("/swagger-ui/**").permitAll()
                    .requestMatchers("/v3/api-docs/**").permitAll()
                    .requestMatchers("/management/health").permitAll()
                    .requestMatchers("/management/health/**").permitAll()
                    .requestMatchers("/management/info").permitAll()
                    .requestMatchers("/management/prometheus").permitAll()
                    .requestMatchers("/management/**").hasAuthority(AuthoritiesConstants.ADMIN)
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions ->
                exceptions
                    .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                    .accessDeniedHandler(new BearerTokenAccessDeniedHandler())
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(withDefaults()));
        return http.build();
    }

    private static String[] moduleReadAuthorities(String module) {
        return new String[] {
            AuthoritiesConstants.ADMIN,
            AuthoritiesConstants.USER,
            "ROLE_MANAGER",
            "ROLE_VIEWER",
            "PERM_" + module + "_READ",
            "PERM_" + module + "_WRITE",
        };
    }

    private static String[] moduleWriteAuthorities(String module) {
        return new String[] {
            AuthoritiesConstants.ADMIN,
            AuthoritiesConstants.USER,
            "ROLE_MANAGER",
            "PERM_" + module + "_WRITE",
        };
    }

    private static String[] moduleEditAuthorities(String module) {
        return new String[] {
            AuthoritiesConstants.ADMIN,
            AuthoritiesConstants.USER,
            "ROLE_MANAGER",
            "PERM_" + module + "_EDIT",
            // Backward compatibility for existing role access mappings
            "PERM_" + module + "_WRITE",
        };
    }

    private static String[] moduleDeleteAuthorities(String module) {
        return new String[] {
            AuthoritiesConstants.ADMIN,
            AuthoritiesConstants.USER,
            "ROLE_MANAGER",
            "PERM_" + module + "_DELETE",
        };
    }
}
