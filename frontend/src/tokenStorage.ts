export type UserToken = { iat: number, userId: number; firstName: string; lastName: string };

export function storeToken( tok: any ): any
{
    try
    {
      localStorage.setItem('token_data', tok.accessToken);
    }
    catch(e)
    {
      console.log(e);
    }
}

export function retrieveToken() : any
{
    var ud;
    try
    {
      ud = localStorage.getItem('token_data');
    }
    catch(e)
    {
      console.log(e);
    }
    return ud;
}

// Used for logout
export function clearToken(): void
{
    try
    {
      localStorage.removeItem('token_data');
      localStorage.removeItem('user_data');
    }
    catch(e)
    {
      console.log(e);
    }
}

// TODO:
// Probably need another function to verify that tokens arent old! Called each time the page is changed.